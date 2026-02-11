const Modal = ({ children, title, closeFn }: { children: React.ReactNode, title: string, closeFn: () => void }) => {

  return (
    <div className="absolute top-0 w-full h-full flex items-center justify-center">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-6 ">
        <div className="flex flex-row items-center mb-1">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <button className="ml-auto cursor-pointer" onClick={closeFn}>X</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default Modal;