import { EventEmitter } from "events";
import { Notification } from "src/db";

class EventBus extends EventEmitter {}

const eventBus = new EventBus();
eventBus.setMaxListeners(50);

const EVENTS = {
  SIGNUP: "SIGNUP",
  NEW_SUBSCRIPTION: "NEW_SUBSCRIPTION",
};

eventBus.on(EVENTS.SIGNUP, async (data) => {
  await Notification.create({
    title: "New User Signup",
    details: `A new user has signed up with the email: ${data.email}`,
  });
});

eventBus.on(EVENTS.NEW_SUBSCRIPTION, async () => {
  await Notification.create({
    title: "New Subscription",
    details: `A user has subscribed to a new plan.`,
  });
});

const triggerNotification = (event: keyof typeof EVENTS, data: any) => {
  eventBus.emit(event, data);
};

export { EVENTS, triggerNotification };
