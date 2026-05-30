import {
  resolveStagingRelaxations,
  type StagingRelaxationsSnapshot,
} from "@workspace/policy";

export function getStagingRelaxations(): StagingRelaxationsSnapshot {
  return resolveStagingRelaxations(process.env);
}

/** Public guest surfaces — safe subset for unauthenticated clients. */
export function buildPublicSurfaceConfig() {
  const relax = getStagingRelaxations();
  return {
    deployEnv: relax.deployEnv,
    stagingRelaxed: relax.active,
    guestHub: {
      otpMode: relax.guestHub.otpMode,
      phoneMode: relax.guestHub.phoneMode,
      magicOtpCode: relax.guestHub.magicOtpCode,
      exposeDevOtp: relax.guestHub.exposeDevOtp,
    },
  };
}
