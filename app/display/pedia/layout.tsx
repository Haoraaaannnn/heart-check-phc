export default function RegistrationPage ({children}: {children: React.ReactNode}){
    return(
        <div className ="w-screen h-screen bg-white md:py-10 md:px-10 flex flex-col items-center justify-center">
            <div className = "w-full max-w-8xl h-full bg-gray-200 rounded-4xl p-6 md:p-10 shadow-lg flex flex-col item-center justify-baseline gap-8">
                <h1 className="w-full max-w-8xl bg-white py-5 rounded-4xl shadow-2xl text-4xl font-bold text-black text-center">Pedia</h1>
                <main>{children}</main>

            </div>
        </div>
    );
}