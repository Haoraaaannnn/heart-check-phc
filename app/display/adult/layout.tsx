import BgCard from "@/components/ui/bgCard";
import BgDisplay from "@/components/ui/bgDisplay";
import DisplayHeader from "@/components/ui/displayHeader";

export default function RegistrationPage ({children}: {children: React.ReactNode}){
    return(
        <BgDisplay>
            <BgCard>
                <DisplayHeader>Adult Clinic</DisplayHeader>
                <main>{children}</main>
            </BgCard>
        </BgDisplay>
    );
}