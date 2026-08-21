import FileUploader from '@/components/FileUpLoader/FileUpLoader';

export default function Home() {
  //CONSOLE
  console.log(process.env.NODE_ENV);

  return (
    <main className="bg-red-500">
      <FileUploader />
    </main>
  );
}
