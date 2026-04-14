const { prisma } = require("../config/database");
const { generateId } = require("../utils/id");

const SUPER_ADMIN_EMAIL =
  process.env.SUPER_ADMIN_EMAIL || "nexussphere0974@gmail.com";

const formatCategory = (category) => ({
  id: category.id,
  name: category.name,
  slug: category.slug,
  created_at: category.created_at,
  event_count: category._count?.events || 0,
});

// Get all categories
const getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.eventCategory.findMany({
      include: {
        _count: {
          select: {
            events: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    res.json({ success: true, categories: categories.map(formatCategory) });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get single category
const getCategoryById = async (req, res) => {
  try {
    const category = await prisma.eventCategory.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: {
            events: true,
          },
        },
      },
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ success: true, category: formatCategory(category) });
  } catch (error) {
    console.error("Get category error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create new category (admin only)
const createCategory = async (req, res) => {
  try {
    if (req.user?.email !== SUPER_ADMIN_EMAIL) {
      return res
        .status(403)
        .json({ message: "Only super admin can create categories" });
    }

    const { name, slug } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ message: "Name and slug are required" });
    }

    // Check if slug exists
    const existing = await prisma.eventCategory.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (existing) {
      return res
        .status(400)
        .json({ message: "Category with this slug already exists" });
    }

    await prisma.eventCategory.create({
      data: {
        id: generateId(),
        name,
        slug,
      },
    });

    res
      .status(201)
      .json({ success: true, message: "Category created successfully" });
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update category (admin only)
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug } = req.body;

    const category = await prisma.eventCategory.findUnique({
      where: { id },
      select: { id: true, slug: true },
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (slug && slug !== category.slug) {
      const existing = await prisma.eventCategory.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (existing) {
        return res
          .status(400)
          .json({ message: "Category with this slug already exists" });
      }
    }

    const updateData = {};
    if (typeof name === "string" && name.trim()) {
      updateData.name = name;
    }
    if (typeof slug === "string" && slug.trim()) {
      updateData.slug = slug;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.eventCategory.update({
        where: { id },
        data: updateData,
      });
    }

    res.json({ success: true, message: "Category updated successfully" });
  } catch (error) {
    console.error("Update category error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete category (admin only)
const deleteCategory = async (req, res) => {
  try {
    if (req.user?.email !== SUPER_ADMIN_EMAIL) {
      return res
        .status(403)
        .json({ message: "Only super admin can delete categories" });
    }

    const { id } = req.params;

    const category = await prisma.eventCategory.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Check if category has events
    const eventCount = await prisma.event.count({
      where: { category_id: id },
    });

    if (eventCount > 0) {
      return res.status(400).json({
        message: `Cannot delete category with ${eventCount} events. Reassign events first.`,
      });
    }

    await prisma.eventCategory.delete({ where: { id } });

    res.json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
