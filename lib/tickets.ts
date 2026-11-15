import prisma from "@/lib/prisma";

type WithPeople = { assigneeId: string | null; ownerId: string | null };

export async function attachAssignees<T extends WithPeople>(tickets: T[]) {
  const ids = [
    ...new Set(
      tickets
        .flatMap((ticket) => [ticket.assigneeId, ticket.ownerId])
        .filter((id): id is string => id !== null)
    ),
  ];

  const users =
    ids.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: ids } },
          select: { id: true, name: true },
        })
      : [];

  const names = new Map(users.map((user) => [user.id, user.name]));

  return tickets.map((ticket) => ({
    ...ticket,
    assigneeName: ticket.assigneeId
      ? (names.get(ticket.assigneeId) ?? null)
      : null,
    ownerName: ticket.ownerId ? (names.get(ticket.ownerId) ?? null) : null,
  }));
}