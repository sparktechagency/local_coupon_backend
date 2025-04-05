## Impacto
Impacto is a local coupon app that allows users to find and redeem coupons from local businesses and allows businesses to offer coupons to their customers.

## Tech Stack
Backend: Node.js, Express, MongoDB

## Features
- Authentication
- User and Business Owner Subscriptions
- Coupon Management
- User and Business Profile Management
- Notifications
- Business Analytics
- Business Coupon Management

## Admin Features
- Admin Dashboard
- Admin User and Business Management
- Subscription Management
- Coupon Category Management
- Helpdesk Management


## Roadmap
- [business profile] home page analytics
- qr code scan analytics
- notification system
- referral system (if someone invites 20 people to the app, they get 1 month extra free trial)

- home page - search, categories, carousel, recommended coupons
- coupon filters - category & location filters


### API Endpoints

## Auth
- ✅ login
- ✅ google-login
- ✅ apple-login
- ✅ fb-login
- ✅ refresh token
- ✅ forgot-password
- ✅ reset-password
- ✅ signup
- ✅ verify-otp
- ✅ switch-account

## Stripe
- ✅ create-payment

## Home/Explore
- ✅ [GET] home?query&category&location
    - Response: 
    ```
    {
        categories: [],
        carousel: [],
        coupons: []
    }
    ```
- ✅ business-analytics

## Coupons
- ✅ get-coupons
- ✅ delete-coupon
- ✅ download-coupon
- ✅ add-coupon
- ✅ update-coupon
- ✅ qr-code
- ✅ redeem-coupon
- ✅ share-coupon
- ✅ coupon-analytics

## Profile
- ✅ get-profile
- ✅ get-business-profile
- ✅ last-visit
- ✅ update-profile / update-picture
- ✅ delete-profile
- ✅ change-password

## Legal
- ✅ faqs
- ✅ terms
- ✅ privacy

## Contact Us
- ✅ contact-us

## Referral System
- ✅ invite-friends

## Notification System
- ws

## Admin Panel
- dashboard
- recent-transactions
- ✅ business-owners
- ✅ users
- ✅ ban/unban users
- ✅ add-subscription
- get-subscriptions
- update-subscription
- delete-subscription
- ✅ premium-subscribers
- ✅ get-categories
- ✅ add-category
- ✅ update-category
- ✅ delete-category
- ✅ update-faqs
- ✅ update-terms
- ✅ update-privacy


