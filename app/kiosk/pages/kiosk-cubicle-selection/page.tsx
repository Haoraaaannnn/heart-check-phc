import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/facilityHelpers";
import { redirect } from "next/navigation";
import { getCachedServiceById, getCachedDoctorsMap } from "@/lib/cache/facilityMetadataCache";
import CubicleCardsGrid from "@/app/kiosk/pages/kiosk-cubicle-selection/components/CubicleCardsGrid";
import CubicleHeader from "@/app/kiosk/pages/kiosk-cubicle-selection/components/CubicleHeader";
import { CubicleSelectorType } from "@/app/kiosk/pages/kiosk-cubicle-selection/types/CubicleSelectorType";
import { getTimestamp } from "@/lib/logger";
import {
    CubicleLayoutStyle,
    CubicleLayoutClasses,
} from "@/app/kiosk/pages/kiosk-cubicle-selection/constants/cubicleLayout";

/** Props Next.js passes to the cubicle selection page. */
interface KioskCubicleSelectionPageProps {
    /**
     * URL query parameters (Promise in Next.js 15).
     */
    searchParams: Promise<{
        serviceId?: string;
        type?: string;
        subcategory?: string;
    }>;
}

/**
 * Kiosk cubicle selection page (`/kiosk/pages/kiosk-cubicle-selection`).
 *
 * Server component that queries `cubicle_selector` records joined with their
 * linked physical cubicles and assigned active doctors, presenting them for patient selection.
 *
 * @remarks
 * **Access Control Guard:**
 * Cubicle selection is strictly restricted to Consultation patients.
 * If accessed without a `serviceId` or for a non-consultation service (such as
 * OPD Screening), patients are automatically redirected to the appropriate
 * downstream screen (`sms-input` or `kiosk-services`).
 *
 * **Doctor Roster Resolution:**
 * Gathers assigned `doctorId` foreign keys across linked cubicles, queries the
 * `doctors` directory (with server-side fallback to `supabaseAdmin` if anonymous RLS
 * policies restrict directory reads on kiosk terminals), and enriches each cubicle
 * option with physician metadata.
 *
 * Follows the single-container layout pattern of `category-selection`:
 * - Outer container centers all content vertically and horizontally within `<main>`.
 * - Inner content wrapper bundles the greetings prompt (`CubicleHeader`) directly above
 *   the cubicle cards grid with tight spacing as one cohesive unit.
 *
 * @param props - Page props provided by Next.js.
 * @returns The grid of cubicle selector options with assigned doctor details.
 */
export default async function KioskCubicleSelectionPage({
    searchParams,
}: KioskCubicleSelectionPageProps) {
    const { serviceId, type, subcategory } = await searchParams;
    const supabase = await createClient();

    // Guard: Require serviceId; otherwise redirect to service catalog
    if (!serviceId) {
        redirect(
            type
                ? `/kiosk/pages/kiosk-services?type=${encodeURIComponent(type)}`
                : "/kiosk/pages/kiosk-services"
        );
    }

    // Fetch active service from cache to verify eligibility for cubicle selection
    const service = await getCachedServiceById(supabase, serviceId);

    const serviceLabel = service?.label_en?.trim().toLowerCase();

    // Guard: Cubicle selection is strictly restricted to services requiring cubicles.
    // If accessed for a service without cubicles, redirect to SMS input.
    if (!service || !service.requires_cubicle) {
        const params = new URLSearchParams();
        if (serviceId) params.set("serviceId", serviceId);
        if (type) params.set("type", type);
        if (subcategory) params.set("subcategory", subcategory);
        redirect(`/kiosk/pages/sms-input?${params.toString()}`);
    }

    // Fetch cubicle selector groupings ordered by administrative sequence.
    const { data: cubicles, error } = await supabase
        .from("cubicle_selector")
        .select(`
            *,
            cubicles:cubicle_selector_cubicle(
                cubicle:cubicle!cubicle_selector_cubicle_cubicle_id_fkey(
                    "cubicleNum",
                    category,
                    subcategory,
                    "doctorId"
                )
            )
        `)
        .order("cubicle_order", { ascending: true });

    if (error) {
        console.error(`${getTimestamp()} [CUBICLE SELECTOR ERROR]:`, error);
    }

    // Direct query for active service cubicles to build fallback name-to-doctor mapping
    const { data: directCubicles } = await supabase
        .from("cubicle")
        .select(`"cubicleNum", category, subcategory, "doctorId"`)
        .eq("category", service.label_en);

    const cubicleDocIdMap = new Map<string, string>();
    (directCubicles || []).forEach((c: { cubicleNum: string | null; doctorId: string | null }) => {
        if (c.cubicleNum && c.doctorId) {
            const rawKey = c.cubicleNum.trim().toLowerCase();
            cubicleDocIdMap.set(rawKey, c.doctorId);

            const strippedKey = c.cubicleNum
                .replace(/^cubicle\s*/i, "")
                .trim()
                .toLowerCase();
            if (strippedKey) {
                cubicleDocIdMap.set(strippedKey, c.doctorId);
            }
        }
    });

    // Collect all doctor IDs across joined cubicles and direct cubicles
    const allDoctorIds = new Set<string>();
    (directCubicles || []).forEach((c: { doctorId: string | null }) => {
        if (c.doctorId) allDoctorIds.add(c.doctorId);
    });
    (cubicles || []).forEach((cs: { cubicles?: { cubicle: { doctorId?: string | null } | null }[] }) => {
        (cs.cubicles || []).forEach((link) => {
            if (link.cubicle?.doctorId) {
                allDoctorIds.add(link.cubicle.doctorId);
            }
        });
    });

    const doctorIdsList = Array.from(allDoctorIds);
    const doctorNameById = new Map<string, string>();

    if (doctorIdsList.length > 0) {
        const cachedDoctors = await getCachedDoctorsMap(supabase);
        const missingDoctorIds: string[] = [];

        for (const docId of doctorIdsList) {
            if (cachedDoctors[docId]) {
                doctorNameById.set(docId, cachedDoctors[docId]);
            } else {
                missingDoctorIds.push(docId);
            }
        }

        if (missingDoctorIds.length > 0) {
            try {
                const { data: adminDocs } = await supabaseAdmin
                    .from("doctors")
                    .select("id, full_name")
                    .in("id", missingDoctorIds);
                (adminDocs || []).forEach((d) => {
                    if (d.id && d.full_name) {
                        doctorNameById.set(d.id, d.full_name.trim());
                    }
                });
            } catch (adminErr) {
                console.error(
                    `${getTimestamp()} [CUBICLE DOCTOR FETCH ERROR]:`,
                    adminErr
                );
            }
        }
    }

    // Enrich each cubicle selector record with resolved doctor names
    const enrichedCubicles: CubicleSelectorType[] = (cubicles || []).map((cs: any) => {
        const enrichedLinks = (cs.cubicles || []).map((link: any) => {
            if (!link.cubicle) return link;
            const cubicleNumKey = (link.cubicle.cubicleNum || "").trim().toLowerCase();
            const strippedKey = (link.cubicle.cubicleNum || "")
                .replace(/^cubicle\s*/i, "")
                .trim()
                .toLowerCase();

            const resolvedDoctorId =
                link.cubicle.doctorId ||
                cubicleDocIdMap.get(cubicleNumKey) ||
                cubicleDocIdMap.get(strippedKey) ||
                null;

            const docName = resolvedDoctorId
                ? doctorNameById.get(resolvedDoctorId) || null
                : null;

            return {
                ...link,
                cubicle: {
                    ...link.cubicle,
                    doctorId: resolvedDoctorId,
                    doctorName: docName,
                },
            };
        });

        // Resolve card-level doctor name (matching linked cubicles or name matching)
        const selectorNameKey = (cs.cubicle_name || "").trim().toLowerCase();
        const strippedSelectorKey = (cs.cubicle_name || "")
            .replace(/^cubicle\s*/i, "")
            .trim()
            .toLowerCase();

        const directDoctorId =
            cubicleDocIdMap.get(selectorNameKey) ||
            cubicleDocIdMap.get(strippedSelectorKey);

        const linkDoctorNames = Array.from(
            new Set(
                enrichedLinks
                    .map((l: any) => l.cubicle?.doctorName)
                    .filter(Boolean)
            )
        ) as string[];

        const primaryDoctorName =
            linkDoctorNames.length > 0
                ? linkDoctorNames.join(", ")
                : directDoctorId
                ? doctorNameById.get(directDoctorId) || null
                : null;

        return {
            ...cs,
            cubicles: enrichedLinks,
            doctorName: primaryDoctorName,
        };
    });

    return (
        <div
            className={CubicleLayoutClasses.container}
            style={CubicleLayoutStyle.container}
        >
            <div
                className={CubicleLayoutClasses.contentWrapper}
                style={CubicleLayoutStyle.contentWrapper}
            >
                {/* Greetings and instruction header: sticky at top */}
                <header
                    className={CubicleLayoutClasses.headerWrapper}
                    style={CubicleLayoutStyle.headerWrapper}
                >
                    <CubicleHeader />
                </header>

                {/* Scrollable cubicle cards grid with dynamic scroll indicators */}
                <CubicleCardsGrid
                    cubicles={enrichedCubicles}
                    serviceId={serviceId}
                    patientType={type}
                    subcategory={subcategory}
                />
            </div>
        </div>
    );
}