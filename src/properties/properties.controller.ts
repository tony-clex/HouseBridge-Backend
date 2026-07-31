import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middleware/authenticate";
import { uploadImageToCloudinary } from "../utils/cloudinary";
import { supabase } from "../utils/supabase";

export const getProperties = async (req: Request, res: Response) => {
  try {
    const { location, university, maxPrice } = req.query;

    let query = supabase
      .from("Properties")
      .select("*, PropertyImages(url)")
      .eq("status", "Available")
      .order("createdAt", { ascending: false });

    if (location) query = query.ilike("location", `%${location}%`);
    if (university) query = query.ilike("universityProximity", `%${university}%`);
    if (maxPrice) query = query.lte("price", Number(maxPrice));

    const { data, error } = await query;

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ properties: data });
  } catch (error: any) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getPropertyById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("Properties")
      .select(`
        *,
        PropertyImages(url),
        Users!landlordId(fullName, email, phone)
      `)
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Property not found" });
    }

    return res.status(200).json({ property: data });
  } catch (error: any) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const createProperty = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const landlordId = req.user!.id;
    const { title, description, price, location, universityProximity, amenities } = req.body;

    if (!title || !price || !location) {
      return res.status(400).json({ error: "Title, price, and location are required." });
    }

    const { data, error } = await supabase
      .from("Properties")
      .insert([
        {
          landlordId,
          title,
          description,
          price,
          location,
          universityProximity,
          amenities: amenities || [],
          status: "Available",
        },
      ])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    return res.status(201).json({ message: "Property created successfully", property: data });
  } catch (error: any) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updateProperty = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const landlordId = req.user!.id;
    const updates = req.body;

    const { data: existing, error: findError } = await supabase
      .from("Properties")
      .select("landlordId")
      .eq("id", id)
      .single();

    if (findError || !existing) return res.status(404).json({ error: "Property not found" });
    if (existing.landlordId !== landlordId)
      return res.status(403).json({ error: "Forbidden: You do not own this property." });

    const { data, error } = await supabase
      .from("Properties")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ message: "Property updated", property: data });
  } catch (error: any) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteProperty = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const landlordId = req.user!.id;

    const { data: existing, error: findError } = await supabase
      .from("Properties")
      .select("landlordId")
      .eq("id", id)
      .single();

    if (findError || !existing) return res.status(404).json({ error: "Property not found" });
    if (existing.landlordId !== landlordId && req.user!.role !== "Admin") {
      return res.status(403).json({ error: "Forbidden: Not authorized to delete this property." });
    }

    const { error } = await supabase.from("Properties").delete().eq("id", id);
    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ message: "Property deleted successfully" });
  } catch (error: any) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const uploadPropertyImages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const landlordId = req.user!.id;

    const { data: existing, error: findError } = await supabase
      .from("Properties")
      .select("landlordId")
      .eq("id", id)
      .single();

    if (findError || !existing) return res.status(404).json({ error: "Property not found" });
    if (existing.landlordId !== landlordId)
      return res.status(403).json({ error: "Forbidden: You do not own this property." });

    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({ error: "No image files provided." });
    }

    const files = req.files as Express.Multer.File[];

    const uploadPromises = files.map((file) => uploadImageToCloudinary(file.buffer));
    const urls = await Promise.all(uploadPromises);

    const imageRecords = urls.map((url) => ({
      propertyId: id,
      url,
    }));

    const { data: savedImages, error: insertError } = await supabase
      .from("PropertyImages")
      .insert(imageRecords)
      .select();

    if (insertError) return res.status(400).json({ error: insertError.message });

    return res.status(201).json({
      message: "Images uploaded successfully",
      images: savedImages,
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Internal server error during upload" });
  }
};
