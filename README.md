# Felix Tell

Website for Felix Tell - Talents for Brands.

## Custom Email Templates

### Setup Supabase Email Templates

To use the custom email templates:

1. Go to your Supabase dashboard
2. Navigate to Authentication → Email Templates
3. For the "Confirmation" template:
   - Set the subject to "Welcome to Felix Tell! Please confirm your email"
   - Replace the default template with the content from `public/email-templates/confirmation.html`
4. Click Save

This will style the confirmation emails to match the Felix Tell Artists' Bureau branding.

## Development

### Installation

```bash
npm install
```

### Running the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
