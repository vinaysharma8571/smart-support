import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { getCurrentUser } from "@/lib/session";

type RouteContext = { params: Promise<{ id: string }> };

const roleSchema = z.object({
  role: z.enum(["customer", "agent", "admin"]),
});

export async function PUT(request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Please log in" }, { status: 401 });
  }

  if (user.role !== "admin") {
    return NextResponse.json(
      { error: "Only admins can change roles" },
      { status: 403 }
    );
  }

  const { id } = await params;

  if (id === user.id) {
    return NextResponse.json(
      { error: "You cannot change your own role" },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = roleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Role must be customer, agent or admin" },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: { role: parsed.data.role },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    throw error;
  }
}