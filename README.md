<p align="center">
  <img src="prompthub-logo.png" alt="Prompthub Logo" width="300" />
</p>

# Prompthub

**Prompthub** is a premier AI Prompt Marketplace and social dApp built on the **Stacks blockchain**, secured by **Bitcoin**. It empowers creators to monetize their AI engineering skills while providing buyers with high-quality, verified prompts.

---

## 🌟 Core Concept

Prompthub is more than just a marketplace; it's a decentralized ecosystem where AI creativity meets Bitcoin security. By leveraging the Stacks blockchain, we ensure:
- **True Ownership**: Prompts are represented as NFTs, giving creators and buyers immutable proof of ownership.
- **Programmable Payments**: Smart contracts handle all transactions (STX & sBTC), ensuring fair trades without intermediaries.
- **Technical Excellence**: High-quality prompts across various AI models (Midjourney, DALL-E, Stable Diffusion, Llama, etc.).

---

## 🚀 Key Features

### 🛒 Decentralized Marketplace
*   **Mint & Sell**: Easily turn your prompts into on-chain assets.
*   **Verified Ownership**: Every purchase is recorded on the Stacks blockchain.
*   **Multi-Currency**: Full support for **STX** and **sBTC** (testnet/mainnet).
*   **x402 Protocol**: Securely unlock premium prompt content only after payment verification.
*   **Additional Resources**: Attach GDrive, GitHub, or extra media links to your listings.

### 🎨 Community & Social
*   **Web3 Identity**: Login with **Leather**, **Xverse**, or **OKX** wallets.
*   **User Profiles**: Customizable @usernames, bios, and reputation roles.
*   **Real-time Messaging**: Chat with other creators, send friend requests, and get typing indicators.
*   **Contests & Challenges**: Participate in community-driven prompt engineering contests.
*   **Bookmarks**: Save your favorite prompts to your personal collection.

### 🛡️ Smart Contract Suite
*   `prompthub-marketplace`: Handles NFT listing, purchasing, and royalties.
*   `prompthub-contests`: Manages secure, on-chain competition and reward distribution.
*   `prompthub-escrow-hire`: Enables safe, escrow-based hiring of prompt engineers for custom work.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **UI Design**: Neobrutalist + Glassmorphism using **Tailwind CSS**.
- **Icons**: **Lucide React**.
- **Web3 Logic**: `@stacks/connect`, `@stacks/transactions`, and `@stacks/network`.

### Backend
- **Framework**: **Laravel 11**.
- **Database**: **PostgreSQL**.
- **Storage**: **Pinata IPFS Bridge** (Decentralized) + Local Storage (Hybrid optimized).
- **Verification**: Custom **x402-stacks** payment verification middleware.

### Smart Contracts
- **Language**: **Clarity 2.0**.
- **Infrastructure**: **Stacks Blockchain** (Secure by Bitcoin L1).

---

## 🚀 Getting Started

### 1. Pre-requisites
- **Clarinet**: For local smart contract development.
- **Node.js 18+**: For the frontend.
- **PHP 8.2+ & Composer**: For the backend.

### 2. Frontend Setup
```bash
cd Prompthub-frontend
npm install
npm run dev
```

### 3. Backend Setup
```bash
cd Prompthub-backend
composer install
php artisan migrate
php artisan serve
```

---

## 💳 Wallet Setup

To interact with Prompthub, you need a Stacks-compatible wallet:
1. Download [Leather](https://leather.io/) or [Xverse](https://www.xverse.app/).
2. Switch your wallet network to **Testnet** (recommended for development).
3. Use the "Connect Wallet" button to authenticate with your Stacks address.

---

## 📄 License
This project is licensed under the MIT License.