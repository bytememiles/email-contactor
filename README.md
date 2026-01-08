# Email Composer 📧

A comprehensive email composition and management platform built with Next.js, TypeScript, and Material-UI. Features professional-grade tools for email marketing, batch operations, and template management.

## ✨ Features

### Core Email Functionality

- 📝 **Rich Markdown Editor** - Write emails using markdown with live preview
- 📧 **Multi-SMTP Support** - Configure and manage multiple SMTP providers
- ⏱️ **Send Delay & Cancellation** - 3-second delay with option to cancel email sending
- 📎 **File Attachments** - Support for file attachments with preview
- 🎨 **Gmail-like Interface** - Familiar interface inspired by Gmail's composer

### Advanced Features

- 📊 **Batch Operations** - Upload CSV files and manage bulk email campaigns
- 🏷️ **Tag Management** - Organize recipients with custom tags and colors
- 📝 **Template System** - Create, save, and reuse email templates
- 🌍 **Timezone Detection** - Automatic timezone detection from location data
- 💾 **Persistent Storage** - Save and manage receiver lists locally
- 🔍 **Smart Validation** - Email validation and data normalization

### Technical Excellence

- 🔧 **TypeScript** - Full type safety throughout the application
- 🎯 **Material-UI** - Modern and responsive UI components
- 🔄 **Redux State Management** - Centralized state with Redux Toolkit
- 🛠️ **Dev Tools** - ESLint, Prettier, and Husky for code quality
- 🔒 **Secure Storage** - Encrypted SMTP configurations

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

## Settings Page

The Settings page is the central hub for managing all aspects of your email campaigns. Access it by navigating to `/settings` in your browser. The settings page features a responsive sidebar navigation with the following sections:

### 📧 SMTP Configuration

**Location:** `/settings/smtp`

Manage your SMTP server configurations for sending emails. This is where you set up and maintain your email sending credentials.

**Features:**

- **Add Multiple SMTP Configurations** - Configure multiple email accounts or SMTP providers
- **Test Connections** - Verify SMTP settings before saving
- **Set Default Configuration** - Choose which SMTP server to use by default
- **Edit & Delete** - Update or remove existing configurations
- **Encrypted Storage** - All credentials are stored securely in browser local storage

**Configuration Fields:**

- **Name** - A friendly name to identify this configuration
- **Host** - SMTP server address (e.g., `smtp.gmail.com`)
- **Port** - SMTP port (commonly `587` for TLS, `465` for SSL)
- **Encryption** - Choose between TLS or SSL
- **Username** - Your email address or SMTP username
- **Password** - Your email password or app password
- **From Address** - The email address that will appear as the sender

**Note:** You must have at least one SMTP configuration before you can send emails or create profiles.

### 📝 Templates

**Location:** `/settings/templates`

Create and manage email templates with placeholders for personalized content. Templates help you maintain consistency and speed up your email composition.

**Features:**

- **Create Templates** - Build reusable email templates with markdown support
- **Placeholder Support** - Use placeholders like `{{name}}`, `{{email}}`, `{{company}}` for personalization
- **Preview** - See how your template will look before saving
- **Edit & Delete** - Update existing templates or remove ones you no longer need
- **Template Library** - View all your saved templates in one place

**Use Cases:**

- Welcome emails
- Newsletter templates
- Follow-up messages
- Campaign-specific templates

### 📊 Bulk Email

**Location:** `/settings/bulk-email`

Upload CSV files, manage recipients, and schedule bulk email campaigns. This is your command center for large-scale email operations.

**Features:**

#### CSV Upload & Processing

- **Upload CSV Files** - Import recipient data from CSV files
- **Automatic Validation** - Email addresses are validated automatically
- **Data Normalization** - Phone numbers, addresses, and other fields are standardized
- **Timezone Detection** - Automatic timezone detection from location data
- **Error Handling** - Invalid entries are flagged with detailed error messages

#### Recipient Management

- **Receivers Table** - View and manage all imported recipients
- **Tag Management** - Organize recipients with custom tags and colors
- **Search & Filter** - Quickly find specific recipients
- **Bulk Operations** - Select multiple recipients for batch actions
- **Edit Individual Records** - Update recipient information inline

#### Stored Lists

- **Save Lists** - Save recipient lists for future use
- **Load Lists** - Quickly load previously saved lists
- **List Management** - View, edit, rename, or delete saved lists
- **Export Lists** - Export lists back to CSV format
- **List Statistics** - See total recipients, valid emails, and other metrics

#### Sending Options

- **Immediate Send** - Send emails to all recipients right away
- **Create Job** - Schedule emails for later execution
- **Progress Tracking** - Monitor sending progress in real-time

**CSV Format Requirements:**

- Must include an `email` column
- Optional columns: `name`, `phone`, `address`, `city`, `state`, `zip`, `timezone`, and custom fields
- Supports custom column names that will be mapped automatically

### 👤 Profiles

**Location:** `/settings/profiles`

Create profiles that combine SMTP configurations with email templates. Profiles streamline the email sending process by pre-configuring common combinations.

**Features:**

- **Create Profiles** - Combine an SMTP configuration with an email template
- **Profile Information** - Add full name, company, and other details
- **Quick Selection** - Use profiles in the email composer for faster setup
- **Edit & Delete** - Update or remove profiles as needed

**Profile Components:**

- **Full Name** - The sender's name
- **Company** - Company name (optional)
- **SMTP Configuration** - Select from your configured SMTP servers
- **Email Template** - Choose from your saved templates

**Use Cases:**

- Different departments (Sales, Support, Marketing)
- Multiple brands or companies
- Personal vs. business emails
- Different campaign types

**Note:** You need at least one SMTP configuration before you can create profiles.

### 💼 Jobs

**Location:** `/settings/jobs`

View and manage scheduled email jobs. Jobs allow you to schedule bulk email campaigns with timezone-aware sending.

**Features:**

#### Job Management

- **Create Jobs** - Schedule email campaigns with specific send times
- **Timezone-Aware Scheduling** - Automatically calculates send times based on recipient timezones
- **Job Status** - Track job status (Pending, Scheduled, Sending, Completed, Failed)
- **Edit Jobs** - Modify scheduled jobs before they execute
- **Delete Jobs** - Cancel jobs that are no longer needed

#### Job Details

- **Profile Selection** - Choose which profile (SMTP + template) to use
- **Receiver List** - Select from your saved recipient lists
- **Send Time** - Set the desired send time (e.g., 10:00 AM)
- **Automatic Timezone Calculation** - System calculates optimal send times for each recipient
- **Progress Tracking** - Monitor how many emails have been sent

#### Job History

**Location:** `/settings/jobs/history`

View detailed history of completed and failed jobs.

**Features:**

- **Status Overview** - See job completion status at a glance
- **Error Tracking** - Detailed error messages for failed emails
- **Warning Messages** - View warnings that occurred during sending
- **Progress Statistics** - See sent count, failed count, and total count
- **Timestamps** - Track when jobs were created, scheduled, and completed
- **Expandable Details** - Expand accordions to see full error and warning lists

**Job Statuses:**

- **Pending** - Job created but not yet scheduled
- **Scheduled** - Job is scheduled and waiting to execute
- **Sending** - Job is currently sending emails
- **Completed** - All emails were sent successfully
- **Failed** - Job encountered errors and stopped

**Requirements:**

- Jobs can only be created for receiver lists with a single timezone
- You need at least one profile, template, and receiver list to create a job

### Settings Navigation

The settings page features a responsive sidebar navigation:

- **Desktop** - Permanent sidebar on the left
- **Mobile** - Collapsible drawer accessible via menu button
- **Active State** - Current page is highlighted in the navigation
- **Breadcrumbs** - Navigate back to previous pages easily
- **Theme Toggle** - Switch between light and dark themes

All settings pages are fully responsive and work seamlessly on desktop, tablet, and mobile devices.

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
