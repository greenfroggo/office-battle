export default function PrimaryButton(props: any) {
    return (
      <button
        {...props}
        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl w-full"
      />
    );
  }