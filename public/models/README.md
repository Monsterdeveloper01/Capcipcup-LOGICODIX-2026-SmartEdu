# Panduan Aset Model 3D (.glb / .gltf)

Folder ini digunakan untuk menyimpan file model 3D yang dapat dimuat oleh Three.js / React Three Fiber dalam aplikasi **Capcipcup SmartEdu**.

### Format yang Didukung:
- **`.glb`** (Binary glTF - Sangat direkomendasikan karena tekstur dan mesh terkompresi dalam 1 file).
- **`.gltf`** + file tekstur.

### Cara Menggunakan Model Kustom:
1. Simpan file 3D Anda di sini, misalnya `public/models/heart.glb` atau `public/models/dna.glb`.
2. Model dapat langsung dipanggil di komponen React menggunakan hook `useGLTF` dari `@react-three/drei`:

```tsx
"use client";
import { useGLTF } from "@react-three/drei";

export function CustomModel() {
  const { scene } = useGLTF("/models/heart.glb");
  return <primitive object={scene} scale={1.5} />;
}

// Preload model untuk performa optimal
useGLTF.preload("/models/heart.glb");
```

### Sumber Model 3D Gratis untuk Edukasi:
- [Sketchfab](https://sketchfab.com) (Filter: Downloadable / CC0 / Educational)
- [Poly Pizza](https://poly.pizza) (Low-poly models gratis)
- [NASA 3D Resources](https://nasa3d.arc.nasa.gov/) (Model planet, roket, dan tata surya gratis)

