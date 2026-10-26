/**
 * @fileoverview nurse workstation authorization using the shared, non-destructive staff guard.
 * @remarks Server proxy checks and Supabase RLS remain authoritative.
 */
'use client';
import { useStaffAuthorization } from '@/hooks/useStaffAuthorization';

/** @returns True until the workstation's permitted staff role is verified. */
export function useRequireAuth(): boolean {
<<<<<<< HEAD
  return useStaffAuthorization(['nurse', 'staff', 'doctor', 'admin', 'superadmin']);
=======
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        window.location.reload();
      }
    };
    window.addEventListener('pageshow', handlePageShow);

    const verifyAccess = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (!active) return;

      if (sessionError || !session) {
        window.location.replace('/login');
        return;
      }

      // Query user role by auth_id first, then fallback to email
      let userRole: string | null = null;

      const { data: userByAuth } = await supabase
        .from('users')
        .select('role')
        .eq('auth_id', session.user.id)
        .maybeSingle();

      if (userByAuth) {
        userRole = userByAuth.role;
      } else if (session.user.email) {
        const { data: userByEmail } = await supabase
          .from('users')
          .select('role')
          .eq('email', session.user.email)
          .maybeSingle();

        if (userByEmail) {
          userRole = userByEmail.role;
        }
      }

      if (!active) return;

      const normalizedRole = (userRole || '').toLowerCase().trim();

      if (!userRole || !PERMITTED_NURSE_ROLES.includes(normalizedRole as any)) {
        window.location.replace('/unauthorized');
        return;
      }

      // Granular workstation permission check
      const userWorkstations = session.user.user_metadata?.allowed_workstations;
      if (Array.isArray(userWorkstations) && !userWorkstations.includes('nurse')) {
        window.location.replace('/unauthorized');
        return;
      }

      setChecking(false);
    };

    void verifyAccess();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        window.location.replace('/login');
      }
    });

    return () => {
      active = false;
      window.removeEventListener('pageshow', handlePageShow);
      listener.subscription.unsubscribe();
    };
  }, []);

  return checking;
>>>>>>> 364f5eeb9c087f26bbdd271d6b0b72b1de88411c
}
export default useRequireAuth;
