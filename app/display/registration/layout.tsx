  //          <main>{children}</main>

  //* Possible Template for all screen. Need ma meeting yung about sa database dito (totong laban)
export default function RegistrationPage ({children}: {children: React.ReactNode}){
    return(
        <div className ="w-screen h-screen bg-white md:py-10 md:px-10 flex flex-col items-center justify-center">
            <div className = "w-full max-w-8xl h-full bg-gray-200 rounded-4xl p-6 md:p-10 shadow-lg flex flex-col item-center justify-baseline gap-8">
                <h1 className="w-full max-w-8xl bg-white py-5 rounded-4xl shadow-2xl text-4xl font-bold text-black text-center">Registration</h1>
                <main>{children}</main>

            </div>
            <div className= "w-full mt-auto py-8 flex justify-center item-center gap-12">
                <div className="flex items-center gap-4"> 
                    <div className ="w-6 h-6 rounded-full bg-green-400 shrink-0"></div>
                    <span className ="text-black font-bold text-3xl leading-none">Now Serving</span>
                </div>
                
                <div className="flex item-center gap-4">
                    <div className="w-6 h-6 rounded-full bg-red-600 shrink-0"></div>
                    <span className ="text-black font-bold text-3xl leading-none">No Show</span>
                </div>

                <div className="flex item-center gap-4">
                    <div className="w-6 h-6 rounded-full bg-black shrink-0"></div>
                    <span className ="text-black font-bold text-3xl leading-none">On Queue</span>
                </div>
            </div>
        </div>
    );
}
