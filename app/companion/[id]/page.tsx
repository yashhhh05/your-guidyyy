import React from 'react';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

const CompanionIdPage = async ({ params }: PageProps) => {
  const { id } = await params;
  
  return (
    <div>
      <h1>Companion Details</h1>
      <p>Viewing companion ID: {id}</p>
    </div>
  );
};

export default CompanionIdPage;
