import authorize from "@middleware/auth";
import * as userRouter from "@routes/app";
import webhookRoutes from "@routes/webhook.routes";

const registerUserRoutes = (app: any) => {
  app.use("/auth", userRouter.authRoutes);
  app.use("/profile", authorize(["user"]), userRouter.profileRoutes);
  app.use("/stripe", authorize(["user"]), userRouter.stripeRoutes);
};

const registerRoutesThatNeedsRawBody = (app: any) => {
  app.use("/stripe", webhookRoutes);
};

export { registerUserRoutes, registerRoutesThatNeedsRawBody };
