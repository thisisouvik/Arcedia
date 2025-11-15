import { createThirdwebClient, defineChain } from 'thirdweb';
import { sepolia } from 'thirdweb/chains';

// Create Thirdweb client
export const client = createThirdwebClient({
    clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

export const activeChain = sepolia;

// Contract addresses (will be filled after deployment)
export const CONTRACTS = {
    CREDENTIAL_NFT: process.env.NEXT_PUBLIC_CREDENTIAL_NFT_CONTRACT || '',
    CREDENTIAL_REGISTRY: process.env.NEXT_PUBLIC_CREDENTIAL_REGISTRY_CONTRACT || '',
};

// Helper function to get contract
export function getContractAddress(contractName: keyof typeof CONTRACTS) {
    const address = CONTRACTS[contractName];
    if (!address) {
        console.warn(`Contract address for ${contractName} not set`);
    }
    return address;
}
