# Email Composer

A modern email composer application built with Next.js, TypeScript, and Material-UI, featuring Gmail-style interface and markdown support.

## Features

- 📝 **Markdown Editor** - Write emails using markdown with live preview
- 📧 **SMTP Integration** - Send emails through Gmail SMTP service
- ⏱️ **Send Delay & Cancellation** - 3-second delay with option to cancel email sending
- 🎨 **Gmail-like Interface** - Familiar interface inspired by Gmail's composer
- 🔧 **TypeScript** - Full type safety throughout the application
- 🎯 **Material-UI** - Modern and responsive UI components
- 🛠️ **Dev Tools** - ESLint, Prettier, and Husky for code quality

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Gmail account with App Password

### Installation

1. **Clone and install dependencies:**

   ```bash
   cd email-composer
   pnpm install
   ```

2. **Configure SMTP Settings:**

   The application uses Redux for state management and stores SMTP configurations in browser local storage (encrypted). No environment variables are needed.

   When you first run the application:
   - You'll see an alert indicating no SMTP configuration is found
   - Click the settings icon (⚙️) in the email composer toolbar
   - Add your SMTP configuration through the settings modal

   **For Gmail users:**
   - Host: `smtp.gmail.com`
   - Port: `587`
   - Encryption: `TLS`
   - Username: Your Gmail address
   - Password: Gmail App Password (see next step)
   - From Address: Your Gmail address

3. **Set up Gmail App Password:**

   For security, use a Gmail App Password instead of your regular password:
   - Go to [Google Account settings](https://myaccount.google.com/)
   - Navigate to Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password in the SMTP configuration form

4. **Run the development server:**

   ```bash
   pnpm dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. **Click the compose button** (floating button in bottom-left corner)
2. **Fill in recipient and subject**
3. **Write your email using markdown** in the Edit tab
4. **Preview your email** in the Preview tab to see how it will look
5. **Click Send** - you'll have 3 seconds to cancel if needed
6. **Email sent!** You'll receive a confirmation notification

### Markdown Features

The editor supports all standard markdown features:

- **Headers** - `# H1`, `## H2`, etc.
- **Emphasis** - `*italic*`, `**bold**`
- **Links** - `[text](url)`
- **Images** - `![alt](image-url)`
- **Lists** - `- item` or `1. item`
- **Code** - `` `inline` `` or `code blocks`
- **Quotes** - `> quote text`
- **Tables** - Standard markdown tables

## Development

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix ESLint errors
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check code formatting
- `pnpm type-check` - Run TypeScript checks

### Code Quality

This project uses several tools to ensure code quality:

- **ESLint** - Code linting and error detection
- **Prettier** - Code formatting
- **Husky** - Git hooks for pre-commit checks
- **lint-staged** - Run linters on staged files only

Git hooks will automatically:

- Run ESLint and fix issues
- Format code with Prettier
- Ensure TypeScript compiles

## Project Structure

```
src/
├── app/
│   ├── api/send-email/    # Email sending API endpoint
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Home page
├── components/
│   └── EmailComposer.tsx # Main email composer component
└── lib/
    ├── email.ts          # SMTP email utilities
    └── markdown.ts       # Markdown to HTML conversion
```

## Technologies Used

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Redux Toolkit** - State management with RTK
- **React Redux** - Redux bindings for React
- **Material-UI** - React component library
- **Nodemailer** - Email sending library
- **@uiw/react-md-editor** - Markdown editor component
- **Marked** - Markdown parser
- **html-to-text** - HTML to plain text conversion

## Security Notes

- SMTP configurations are stored encrypted in browser local storage
- Always use Gmail App Passwords instead of your main password
- Enable 2-Step Verification on your Gmail account
- Consider using environment-specific email accounts for development
- SMTP credentials never leave the browser and are not sent to any server

## Troubleshooting

### Common Issues

1. **"No SMTP Configuration Found" alert:**
   - Click the settings icon (⚙️) to open SMTP settings
   - Add at least one SMTP configuration
   - The first configuration automatically becomes the default

2. **"Authentication failed" error:**
   - Ensure you're using an App Password, not your regular Gmail password
   - Verify 2-Step Verification is enabled on your Google account
   - Double-check your username and password in the SMTP settings

3. **"SMTP connection failed":**
   - Check your internet connection
   - Verify the SMTP settings are correct
   - Ensure your firewall isn't blocking port 587
   - Test the configuration using the test button in settings

4. **Emails not sending:**
   - Check the browser console for errors
   - Verify all SMTP settings are configured correctly
   - Ensure you have selected a default SMTP configuration
   - Test with a simple email first

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).
