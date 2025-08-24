# Textify

Textify is a simple yet powerful web application designed to clean and refine AI-generated text. With a clean and intuitive interface, users can paste their text, and with a single click, get a cleaned-up version, free of common formatting artifacts like markdown symbols.

## Features

- **Text Cleaning**: Removes unwanted symbols (e.g., `#`, `*`) and formatting from your text.
- **Side-by-Side View**: Compare the original and cleaned text in a convenient two-panel layout.
- **Copy to Clipboard**: Easily copy the cleaned text with one click.
- **Responsive Design**: A seamless experience across desktop and mobile devices.
- **Loading State**: A skeleton loader provides visual feedback while the text is being cleaned.
- **Adding more features soon**

## Tech Stack

This project is built with a modern tech stack:

- **Framework**: [Next.js](https://nextjs.org/) (with App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI**: [React](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
- **AI/Backend**: [Genkit (Firebase)](https://firebase.google.com/docs/genkit)
- **Icons**: [Lucide React](https://lucide.dev/guide/packages/lucide-react)

## Getting Started

To get started with the application, take a look at the main page component in `src/app/page.tsx`. The core AI logic for cleaning text is defined as a Genkit flow in `src/ai/flows/clean-text.ts`.
