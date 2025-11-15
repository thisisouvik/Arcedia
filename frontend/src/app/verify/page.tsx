'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, ExternalLink, Shield, Calendar, User, Building2, FileText, Hash } from 'lucide-react';
import Link from 'next/link';

interface CredentialData {
    id: string;
    token_id: string;
    ipfs_hash: string;
    blockchain_hash: string;
    metadata: any;
    issued_at: string;
    revoked: boolean;
    revoked_at: string | null;
    student_wallet_address: string;
    issuer_wallet_address: string;
    institution: {
        name: string;
        wallet_address: string;
    };
}

export default function VerifyPage() {
    const searchParams = useSearchParams();
    const tokenId = searchParams.get('token');

    const [loading, setLoading] = useState(true);
    const [credential, setCredential] = useState<CredentialData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [verificationStatus, setVerificationStatus] = useState<'valid' | 'invalid' | 'revoked' | null>(null);

    useEffect(() => {
        if (tokenId) {
            verifyCredential(tokenId);
        } else {
            setError('No token ID provided in URL');
            setLoading(false);
        }
    }, [tokenId]);

    const verifyCredential = async (token: string) => {
        try {
            setLoading(true);
            setError(null);

            console.log('🔍 Verifying credential with token:', token);

            // Query the credential from Supabase without authentication
            const { data, error: queryError } = await supabase
                .from('credentials')
                .select(`
                    id,
                    token_id,
                    ipfs_hash,
                    blockchain_hash,
                    metadata,
                    issued_at,
                    revoked,
                    revoked_at,
                    student_wallet_address,
                    issuer_wallet_address,
                    institution:institutions!credentials_institution_id_fkey (
                        name,
                        wallet_address
                    )
                `)
                .eq('token_id', token)
                .single();

            if (queryError) {
                console.error('❌ Query error:', queryError);

                // Check if it's an RLS policy error
                if (queryError.code === 'PGRST116' || queryError.message.includes('policy')) {
                    // Try anonymous query
                    const { data: anonData, error: anonError } = await supabase
                        .from('credentials')
                        .select('*')
                        .eq('token_id', token)
                        .single();

                    if (anonError) {
                        throw new Error('Credential not found. The token ID may be invalid.');
                    }

                    setCredential(anonData as any);
                } else {
                    throw new Error(queryError.message || 'Failed to fetch credential');
                }
            } else if (!data) {
                throw new Error('Credential not found');
            } else {
                setCredential(data as CredentialData);
            }

            // Check if revoked
            if (data?.revoked) {
                setVerificationStatus('revoked');
                console.log('⚠️ Credential is revoked');
            } else {
                setVerificationStatus('valid');
                console.log('✅ Credential is valid');
            }

            // Log verification attempt
            try {
                await supabase.from('verification_logs').insert({
                    credential_id: data?.id,
                    verification_result: {
                        valid: !data?.revoked,
                        token_id: token,
                        verified_at: new Date().toISOString(),
                    },
                });
            } catch (logError) {
                console.warn('Failed to log verification:', logError);
            }

        } catch (err: any) {
            console.error('❌ Verification error:', err);
            setError(err.message || 'Failed to verify credential');
            setVerificationStatus('invalid');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getIPFSUrl = (hash: string) => {
        if (hash.startsWith('http')) return hash;
        return `https://ipfs.io/ipfs/${hash}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-2xl p-8">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="text-gray-600">Verifying credential...</p>
                    </div>
                </Card>
            </div>
        );
    }

    if (error || !credential) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-2xl p-8">
                    <div className="flex flex-col items-center justify-center space-y-6">
                        <div className="rounded-full bg-red-100 p-6">
                            <XCircle className="h-16 w-16 text-red-600" />
                        </div>
                        <div className="text-center space-y-2">
                            <h1 className="text-2xl font-bold text-gray-900">Verification Failed</h1>
                            <p className="text-gray-600">{error || 'Credential not found'}</p>
                        </div>
                        <Link href="/">
                            <Button>
                                Return to Home
                            </Button>
                        </Link>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 py-12 px-4">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-gray-900">Credential Verification</h1>
                    <p className="text-gray-600">Blockchain-verified academic credential</p>
                </div>

                {/* Verification Status */}
                <Card className="p-8">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        {verificationStatus === 'valid' && (
                            <>
                                <div className="rounded-full bg-green-100 p-6">
                                    <CheckCircle className="h-16 w-16 text-green-600" />
                                </div>
                                <div className="text-center space-y-2">
                                    <h2 className="text-2xl font-bold text-gray-900">Credential Verified ✓</h2>
                                    <p className="text-gray-600">This credential is authentic and valid</p>
                                </div>
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                    <Shield className="h-3 w-3 mr-1" />
                                    Blockchain Verified
                                </Badge>
                            </>
                        )}

                        {verificationStatus === 'revoked' && (
                            <>
                                <div className="rounded-full bg-orange-100 p-6">
                                    <AlertCircle className="h-16 w-16 text-orange-600" />
                                </div>
                                <div className="text-center space-y-2">
                                    <h2 className="text-2xl font-bold text-gray-900">Credential Revoked</h2>
                                    <p className="text-gray-600">This credential has been revoked by the issuing institution</p>
                                    {credential.revoked_at && (
                                        <p className="text-sm text-gray-500">
                                            Revoked on: {formatDate(credential.revoked_at)}
                                        </p>
                                    )}
                                </div>
                                <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                                    Revoked
                                </Badge>
                            </>
                        )}
                    </div>
                </Card>

                {/* Credential Details */}
                <Card className="p-8 space-y-6">
                    <h3 className="text-xl font-bold text-gray-900 border-b pb-4">Credential Details</h3>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Student Information */}
                        <div className="space-y-4">
                            <div className="flex items-start space-x-3">
                                <User className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Student Name</p>
                                    <p className="text-base font-semibold text-gray-900">
                                        {credential.metadata?.credentialData?.studentName || 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {credential.student_wallet_address && (
                                <div className="flex items-start space-x-3">
                                    <Hash className="h-5 w-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Student Wallet</p>
                                        <p className="text-xs font-mono text-gray-700 break-all">
                                            {credential.student_wallet_address}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Institution Information */}
                        <div className="space-y-4">
                            <div className="flex items-start space-x-3">
                                <Building2 className="h-5 w-5 text-teal-600 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Issuing Institution</p>
                                    <p className="text-base font-semibold text-gray-900">
                                        {credential.institution?.name || credential.metadata?.credentialData?.institutionName || 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {credential.issuer_wallet_address && (
                                <div className="flex items-start space-x-3">
                                    <Hash className="h-5 w-5 text-teal-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Issuer Wallet</p>
                                        <p className="text-xs font-mono text-gray-700 break-all">
                                            {credential.issuer_wallet_address}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Credential Type & Details */}
                        <div className="space-y-4">
                            <div className="flex items-start space-x-3">
                                <FileText className="h-5 w-5 text-purple-600 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Credential Type</p>
                                    <p className="text-base font-semibold text-gray-900">
                                        {credential.metadata?.credentialData?.credentialType || 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {credential.metadata?.credentialData?.degree && (
                                <div className="flex items-start space-x-3">
                                    <FileText className="h-5 w-5 text-purple-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Degree</p>
                                        <p className="text-base font-semibold text-gray-900">
                                            {credential.metadata.credentialData.degree}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {credential.metadata?.credentialData?.major && (
                                <div className="flex items-start space-x-3">
                                    <FileText className="h-5 w-5 text-purple-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Major</p>
                                        <p className="text-base text-gray-900">
                                            {credential.metadata.credentialData.major}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {credential.metadata?.credentialData?.gpa && (
                                <div className="flex items-start space-x-3">
                                    <FileText className="h-5 w-5 text-purple-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">GPA</p>
                                        <p className="text-base text-gray-900">
                                            {credential.metadata.credentialData.gpa}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Issue Date */}
                        <div className="space-y-4">
                            <div className="flex items-start space-x-3">
                                <Calendar className="h-5 w-5 text-orange-600 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Issue Date</p>
                                    <p className="text-base font-semibold text-gray-900">
                                        {credential.metadata?.credentialData?.issueDate
                                            ? formatDate(credential.metadata.credentialData.issueDate)
                                            : formatDate(credential.issued_at)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Blockchain Details */}
                <Card className="p-8 space-y-4">
                    <h3 className="text-xl font-bold text-gray-900 border-b pb-4">Blockchain Information</h3>

                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Token ID</p>
                            <p className="text-sm font-mono text-gray-900 break-all bg-gray-50 p-3 rounded">
                                {credential.token_id}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Transaction Hash</p>
                            <div className="flex items-center space-x-2">
                                <p className="text-sm font-mono text-gray-900 break-all bg-gray-50 p-3 rounded flex-1">
                                    {credential.blockchain_hash}
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                >
                                    <a
                                        href={`https://sepolia.explorer.zksync.io/tx/${credential.blockchain_hash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                </Button>
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">IPFS Hash</p>
                            <div className="flex items-center space-x-2">
                                <p className="text-sm font-mono text-gray-900 break-all bg-gray-50 p-3 rounded flex-1">
                                    {credential.ipfs_hash}
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                >
                                    <a
                                        href={getIPFSUrl(credential.ipfs_hash)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Actions */}
                <div className="flex justify-center space-x-4">
                    <Link href="/">
                        <Button variant="outline">
                            Return to Home
                        </Button>
                    </Link>
                    <Button
                        onClick={() => window.print()}
                        variant="outline"
                    >
                        Print Verification
                    </Button>
                </div>
            </div>
        </div>
    );
}
