export default function PatientHeaderCard ({children, className}: {children?: React.ReactNode; className?: string}){
    return(
        <div className={`text-lg text-gray-400 font-bold uppercase self-start`}>
            {children}
        </div>
    )
}