/** @fileoverview Staff station ownership labels safe for authenticated workstation displays. */

/** Assignment identity without exposing authentication IDs, emails or patient information. */
export interface StationOwner {
  username: string;
  isCurrentUser: boolean;
}
