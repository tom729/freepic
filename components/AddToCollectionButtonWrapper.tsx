'use client';

import { AddToCollectionButton } from './AddToCollectionButton';

interface AddToCollectionButtonWrapperProps {
  imageId: string;
}

export function AddToCollectionButtonWrapper({ imageId }: AddToCollectionButtonWrapperProps) {
  return <AddToCollectionButton imageId={imageId} variant="outline" size="default" />;
}
