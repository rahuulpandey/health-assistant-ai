import { Router, type IRouter } from "express";
import { ilike, or, eq } from "drizzle-orm";
import { db, doctorsTable } from "@workspace/db";
import { ListDoctorsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/doctors", async (req, res): Promise<void> => {
  const query = ListDoctorsQueryParams.safeParse(req.query);
  let doctors;

  if (query.success && (query.data.specialty || query.data.query)) {
    const conditions = [];
    if (query.data.specialty) {
      conditions.push(ilike(doctorsTable.specialty, `%${query.data.specialty}%`));
    }
    if (query.data.query) {
      conditions.push(
        or(
          ilike(doctorsTable.name, `%${query.data.query}%`),
          ilike(doctorsTable.hospital, `%${query.data.query}%`),
          ilike(doctorsTable.location, `%${query.data.query}%`),
          ilike(doctorsTable.specialty, `%${query.data.query}%`)
        )
      );
    }
    doctors = await db.select().from(doctorsTable).where(conditions[0]);
  } else {
    doctors = await db.select().from(doctorsTable).orderBy(doctorsTable.rating);
  }

  res.json(doctors);
});

export default router;
