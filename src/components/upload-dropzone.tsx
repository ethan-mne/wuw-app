import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { api } from '@/trpc/react';
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { faker } from '@faker-js/faker';
import { Button } from 'react-bootstrap';

interface ImageFileWithPreview extends File {
  preview: string; // URL for the image
}

export interface ImageUploadDropzoneProps {
  name: string;
  initialImages?: string[];
  watchid: string;
  onRefetch: () => Promise<void>;
}

type ImageType = ImageFileWithPreview;

const ImageUploadDropzone: React.FC<ImageUploadDropzoneProps> = ({
  name,
  initialImages = [],
  watchid,
  onRefetch,
}) => {
  const { mutateAsync: addWatchIMG } = api.Watches.addWatchIMG.useMutation();
  const { mutateAsync: removeWatchIMG } =
    api.Watches.removeWatchIMG.useMutation();
  const [combinedImages, setCombinedImages] = useState<ImageType[]>([]);

  useEffect(() => {
    // Set combinedImages based on initialImages from props
    setCombinedImages(
      initialImages.map((url) => ({ preview: url }) as ImageType),
    );
  }, [initialImages]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.forEach((file) => {
        const fileName = `images/${file.name}-${faker.datatype.uuid()}`;
        uploadBytes(storageRef(storage, fileName), file)
          .then((snapshot) => getDownloadURL(snapshot.ref))
          .then((url) => {
            return addWatchIMG({ url, WatchesId: watchid }).then(
              () =>
                ({
                  name: file.name,
                  preview: url,
                }) as ImageType,
            );
          })
          .then((newImageObject) => {
            setCombinedImages((prev) => [...prev, newImageObject]);
            void onRefetch(); // Using 'void' to satisfy the rule since we do not wait here
          })
          .catch((error) => console.error('Error uploading file:', error));
      });
    },
    [addWatchIMG, onRefetch, watchid],
  );

  const removeImage = async (index: number) => {
    const imageToRemove = combinedImages[index];
    if (imageToRemove) {
      await removeWatchIMG(imageToRemove.preview)
        .then(() => {
          const updatedCombinedImages = combinedImages.filter(
            (_, i) => i !== index,
          );
          setCombinedImages(updatedCombinedImages);
          void onRefetch();
        })
        .catch((error) => console.error('Error removing image:', error));
    } else {
      console.error(
        "Attempted to remove an image that doesn't exist at index",
        index,
      );
    }
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const renderPreviews = () => {
    return combinedImages.map((file, index) => (
      <div key={index} style={{ margin: '10px 0' }}>
        <img
          src={file.preview}
          style={{ width: '100px', height: '100px' }}
          alt={file.name || 'Preview'}
        />
        <Button
          variant='danger'
          type='button'
          onClick={() => removeImage(index)}
          style={{ marginLeft: '10px' }}
        >
          Remove
        </Button>
      </div>
    ));
  };

  return (
    <div>
      <div
        {...getRootProps()}
        style={{
          border: '2px dashed black',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <input {...getInputProps()} />
        <p>Drag and drop some files here, or click to select files</p>
      </div>
      <aside>
        <h4>Images</h4>
        <div>{renderPreviews()}</div>
      </aside>
    </div>
  );
};

export default ImageUploadDropzone;
