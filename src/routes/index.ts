import authorize from "@middleware/auth";
import * as userRouter from "@routes/app";
import * as adminRouter from "@routes/admin";
import webhookRoutes from "@routes/webhook.routes";

const registerUserRoutes = (app: any) => {
  app.use("/auth", userRouter.authRoutes);
  app.use("/profile", authorize(["user"]), userRouter.profileRoutes);
  app.use("/stripe", authorize(["user"]), userRouter.stripeRoutes);
};

const registerAdminRoutes = (app: any) => {
  app.use("/admin", authorize(["admin"]), adminRouter.subscriptionsRoutes);
};

const registerRoutesThatNeedsRawBody = (app: any) => {
  app.use("/stripe", webhookRoutes);
};

export {
  registerUserRoutes,
  registerAdminRoutes,
  registerRoutesThatNeedsRawBody,
};
