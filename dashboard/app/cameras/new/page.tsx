import ProvisionForm from '@/components/ProvisionForm';

export default function NewCameraPage() {
  return (
    <>
      <h1 className="text-xl font-bold text-gray-100 mb-2">Provision Camera</h1>
      <p className="text-sm text-gray-500 mb-6">
        Configure the camera's EHome settings first, then provision it here.
        The Device ID must match exactly what you set on the camera.
      </p>
      <ProvisionForm />
    </>
  );
}
