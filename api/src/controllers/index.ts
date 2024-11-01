import { router } from '../helpers/trpc';
import coursesRouter from './courses';
import professorsRouter from './professors';
import reportsRouter from './reports';
import reviewsRouter from './reviews';
import roadmapsRouter from './roadmap';
import scheduleRouter from './schedule';
import usersRouter from './users';

export const appRouter = router({
  courses: coursesRouter,
  professors: professorsRouter,
  roadmaps: roadmapsRouter,
  reports: reportsRouter,
  reviews: reviewsRouter,
  schedule: scheduleRouter,
  users: usersRouter,
});

// Export only the type of a router!
// This prevents us from importing server code on the client.
export type AppRouter = typeof appRouter;
