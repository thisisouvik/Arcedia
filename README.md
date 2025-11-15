

# Acredia - A blockchain-based Academic Credential System

<p align="center"><img src="frontend/public/logo.png" alt="Acredia Logo" width="120" /></p>

---

<!-- Badges (use shields.io) -->
![Next.js](https://img.shields.io/badge/Framework-Next.js-000000?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat&logo=typescript)
![Solidity](https://img.shields.io/badge/Language-Solidity-393939?style=flat&logo=ethereum)
![Hardhat](https://img.shields.io/badge/Tool-Hardhat-8A2BE2?style=flat)
![Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E?style=flat&logo=supabase)

---

## Table of Contents
- [About](#about)
- [Screenshots](#screenshots)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Technology Stacks](#technology-stacks)
- [Project Structure](#project-structure)
  - [Frontend](#frontend)
  - [Contracts](#contracts)
- [Data Flow](#data-flow)
- [Setup & Installation](#setup--installation)
- [Environment Configuration](#environment-configuration)
- [License](#license)
- [Acknowledgements](#acknowledgements)
- [Team](#team)

---

## About

Acredia is an academic credential issuance and verification platform combining on-chain NFT credentials, IPFS metadata storage, and off-chain records via Supabase. The frontend is a Next.js app with wallet/contract integrations, and the contracts are Solidity smart contracts managed with Hardhat.

## Screenshots


![Screenshot 1](frontend/public/screenshots/screenshot-1.png)
![Screenshot 2](frontend/public/screenshots/screenshot-2.png)


---

## Key Features
- On-chain Credential NFT issuance and registry
- IPFS metadata storage (Thirdweb / nft.storage fallback)
- Off-chain index & queries via Supabase (Postgres)
- Wallet integrations (thirdweb, ethers.js)
- Instant verification page and QR code based checks
- Admin flows for institutions to issue credentials

---

## Architecture

```mermaid
graph TB
  subgraph Frontend
    A[Next.js App] -->|calls| B[Supabase API]
    A -->|interacts| C[Smart Contracts]
    A -->|uploads| D[IPFS / Thirdweb Storage]
  end

  subgraph Backend
    B[Supabase] --> E[(Postgres DB)]
  end

  subgraph Chain
    C[CredentialNFT & Registry] --> F[(zkSync / EVM chain)]
  end

  D -->|stores metadata| G[IPFS]
  C -->|emits events| B
  E -->|serves queries| A

  style A fill:#f3f4f6,stroke:#333,stroke-width:1px
  style C fill:#fff7ed,stroke:#333,stroke-width:1px
  style B fill:#ecfeff,stroke:#333,stroke-width:1px
```

---

## Technology Stacks

- Frontend: Next.js (App Router), React, TypeScript, Tailwind CSS, Radix UI
- Wallet/Contracts: thirdweb SDK, ethers.js
- Storage: IPFS (Thirdweb storage primary, nft.storage fallback)
- Backend: Supabase (Postgres with RLS)
- Contracts: Solidity (0.8.x), Hardhat (with zkSync plugin configuration present)
- Tooling: pnpm (preferred), Node.js, TypeScript

---

## Features

- Issue credential NFTs (CredentialNFT.sol)
- Register credential metadata on-chain (CredentialRegistry.sol)
- Store and retrieve credential metadata via IPFS
- Maintain off-chain credential indices and verification logs in Supabase
- Institution admin UI to authorize issuers and upload credentials
- Public verify page to check credential validity by token ID or QR scan

---

## Project Structure

**Frontend**

```
frontend/
  public/
    logo.png
    screenshots/
  src/
    app/
      page.tsx                 # Landing
      layout.tsx               # Global metadata + favicon
      about/page.tsx
      verify/page.tsx          # Public verify page
      admin/page.tsx
      auth/                    # auth routes: login, register, admin-setup, admin-login
      dashboard/page.tsx
    components/
      institution/
        AuthorizeIssuer.tsx
        CredentialUploadForm.tsx
        IssuedCredentialsList.tsx
      student/
        CredentialDiagnostic.tsx
        QRCodeModal.tsx
        StudentCredentialsList.tsx
      ui/                      # UI primitives (button, input, card, dialog, etc.)
    contexts/
      AuthContext.tsx
    hooks/
      useAuth.ts
    lib/
      contracts.ts             # contract helpers (issueCredentialNFT, registerCredential...)
      ipfs.ts                  # IPFS upload helpers
      supabase.ts              # Supabase helpers
      thirdweb.ts
      utils.ts
    types/
      index.ts
  package.json
  tsconfig.json
  postcss.config.mjs
```

**Contracts**

```
contracts/
  contracts/
    CredentialNFT.sol
    CredentialRegistry.sol
  scripts/
    verify/my-contract.js
  hardhat.config.js
  package.json
```

---

## Data Flow

```mermaid
sequenceDiagram
  participant User as User (Browser)
  participant Frontend as Next.js App
  participant Supabase as Supabase
  participant Contracts as Smart Contracts
  participant IPFS as IPFS

  User->>Frontend: Request verification (token ID)
  Frontend->>Supabase: Query credentials by token_id
  Supabase-->>Frontend: Credential metadata + ipfs hash
  Frontend->>IPFS: Fetch metadata (if needed)
  Frontend->>Contracts: Read on-chain status (owner, revoked)
  Contracts-->>Frontend: on-chain response
  Frontend-->>User: Render verification result

  Note over Frontend,Contracts: Issuance flow (admin)
  Frontend->>IPFS: Upload metadata
  IPFS-->>Frontend: IPFS hash
  Frontend->>Contracts: Mint CredentialNFT with metadata hash
  Contracts-->>Frontend: Tx receipt
  Frontend->>Supabase: Insert mapping + logs
```

---

## Setup & Installation

These steps assume you have Node.js and pnpm installed. Adapt commands to `npm` or `yarn` if preferred.

1. Clone the repo

```powershell
Set-Location -Path 
git clone <repo-url> Arcedia
Set-Location -Path .\Arcedia\frontend
```

2. Frontend

```powershell
# from repository root
Set-Location -Path .\frontend\
pnpm install
# start dev server
pnpm dev

# if you changed logo or public assets, clear Next cache:
Remove-Item -Recurse -Force .next
pnpm dev
```

3. Contracts (Hardhat)

```powershell
Set-Location -Path ..\contracts\
pnpm install
# compile
pnpx hardhat compile
# run tests
pnpx hardhat test
```

4. Deploying contracts

Configure env variables (see section below) and run your usual Hardhat deploy scripts. If using zkSync, follow the zkSync plugin documentation configured in `hardhat.config.js`.

---

## Environment Configuration

Add a `.env` or set environment variables on your hosting provider. Sensitive keys must never be committed.

Frontend (example `.env.local` in `frontend`):

```
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id
NEXT_PUBLIC_CREDENTIAL_NFT_CONTRACT=0x...
NEXT_PUBLIC_CREDENTIAL_REGISTRY_CONTRACT=0x...
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=public-anon-key
NEXT_PUBLIC_NFT_STORAGE_KEY=your_nft_storage_key

```

Contracts (example `.env` in `contracts`):

```
PRIVATE_KEY=0xyourprivatekey
RPC_URL=https://rpc.your-provider
```

Environment notes:
- Keep private keys and admin secrets out of source control.
- For local Supabase or migrations, follow the Supabase CLI or dashboard instructions.

---

## License

This project does not include a license file in the repository by default. Add a `LICENSE` file (MIT, Apache-2.0, etc.) depending on your preference. Example: `MIT`.

---

## Acknowledgements

- Built with Next.js, Tailwind, Hardhat, and Supabase
- Icons from `lucide-react`
- Wallet SDKs and storage helpers inspired by thirdweb examples

---

## Team

**Power Button**

Team members:

1. Souvik Mandal
2. Soumen Das
3. Snigdha Mandal
4. Soumen Mandal

---