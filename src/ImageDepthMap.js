import React, { useRef, useState, useEffect } from 'react'
import Sketch from './Sketch'

const ImageDepthMap = ({
  originalImg,
  depthImg,
  verticalThreshold,
  horizontalThreshold,
  respondTo,
  reverseMotion,
  className,
  multiplier = 1,
  useGravity = false,
  rotationCoefX = 0.4,
  rotationCoefY = 0.4,
  rotationAmountX = 18,
  rotationAmountY = 18,
  style,
  onPermissionChange,
}) => {
  const containerRef = useRef()
  const [preloadedImages, setPreloadedImages] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const [imageAspect, setImageAspect] = useState(null);
  const [sketchReady, setSketchReady] = useState(false);

  useEffect(() => {
    setShowLoader(true);
    setSketchReady(false);
    const startTime = Date.now();
    const minLoadTime = 300; // Minimum 300ms to show loader
    
    // Preload original image to get aspect ratio for loader
    const aspectImg = new Image();
    aspectImg.src = originalImg;
    aspectImg.onload = () => {
      setImageAspect(aspectImg.naturalHeight / aspectImg.naturalWidth);
    };
    
    loadImages([originalImg, depthImg], (images) => {
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadTime - elapsed);
      
      setTimeout(() => {
        setPreloadedImages(images);
        // Wait for Sketch to initialize before hiding loader
        setTimeout(() => {
          // Check if canvas exists in the container
          const checkCanvas = () => {
            if (containerRef.current) {
              const canvas = containerRef.current.querySelector('canvas');
              if (canvas) {
                setSketchReady(true);
                // Small delay to ensure canvas is rendering
                setTimeout(() => {
                  setShowLoader(false);
                }, 50);
              } else {
                // Canvas not ready yet, check again
                requestAnimationFrame(checkCanvas);
              }
            }
          };
          checkCanvas();
        }, 100);
      }, remainingTime);
    });
  }, [originalImg, depthImg])

  const loadImage = (url, callback) => {
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.src = url
    image.onload = callback
    return image
  }
  const loadImages = (urls, callback) => {
    let images = []
    let imagesToLoad = urls.length

    // Called each time an image finished loading.
    let onImageLoad = () => {
      --imagesToLoad
      // If all the images are loaded call the callback.
      if (imagesToLoad === 0) {
        callback(images)
      }
    }

    for (let ii = 0; ii < imagesToLoad; ++ii) {
      let image = loadImage(urls[ii], onImageLoad)
      images.push(image)
    }
  }

  const handlePermissionChange = (status) => {
    if(onPermissionChange){
      onPermissionChange(status);
    }
  }

  return (
    <div ref={containerRef} className={`image-DepthMap${className ? ' ' + className : ''}`} style={{ position: 'relative', width: '100%', height: '100%', minHeight: '100px', minWidth: '100px', ...style }}>
      {preloadedImages ? <Sketch
        container={containerRef.current}
        imageOriginal={preloadedImages[0]}
        imageDepth={preloadedImages[1]}
        vth={verticalThreshold * multiplier}
        hth={horizontalThreshold * multiplier}
        useGravity={useGravity}
        respondTo={respondTo || 'mouseMove'}
        reverseMotion={reverseMotion}
        rotationCoefX={rotationCoefX}
        rotationCoefY={rotationCoefY}
        rotationAmountX={rotationAmountX}
        rotationAmountY={rotationAmountY}
        onPermissionChange={handlePermissionChange}
      /> : null}
      {showLoader && <Loader containerRef={containerRef} imageAspect={imageAspect} />}
    </div>
  )
}

const Loader = ({ containerRef, imageAspect }) => {
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef?.current || !imageAspect) return;

    const updateSize = () => {
      const width = containerRef.current.offsetWidth;
      const height = width * imageAspect; // Same calculation as Sketch component
      setContainerSize({ width, height });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [containerRef, imageAspect]);

  if (!imageAspect || containerSize.width === 0) {
    return null;
  }

  return (
    <div style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: `${containerSize.width}px`,
      height: `${containerSize.height}px`,
    }}>
      <img 
        src="/portrait.webp" 
        alt="" 
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    </div>
  );
}

export default ImageDepthMap