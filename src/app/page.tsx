import FileUploader from "@/components/FileUpLoader/FileUpLoader";

export default function Home() {
  
  //CONSOLE
  // console.log(process.env.NODE_ENV);
  console.log("v: 2.1.0")

  return (
    <main className="bg-red-500">
      <FileUploader />
    </main>
  );
}
