export default function SMSBanner(){
    return(
        <div className="relative z-10 mx-8 mt-8 bg-gradient-to-br from-[#DE1717] to-[#F66565] rounded-[45px] px-6 py-4 overflow-hidden shadow-[0_4px_30px_5px_#CF000080]">
            <div className="absolute inset-0 z-0"
            style={{
                backgroundImage: `radial-gradient(circle, #c4a0a0 3px, transparent 1px)`,
                backgroundSize: "64px 64px",
                opacity: 0.3
            }}>
            </div>
            <p className="text-[#FFE600] font-baloo font-black text-[50px] drop-shadow-sm">Welcome to Heart Check PHC!</p>
        </div>
    );
}