// Reusable Prisma includes that exclude passwordHash from User records

export const USER_SAFE_SELECT = {
  select: {
    id: true,
    email: true,
    role: true,
    status: true,
    emailVerified: true,
    createdAt: true,
    updatedAt: true,
  },
} as const;

export const SHIPPER_WITH_PROFILE = {
  select: {
    id: true,
    email: true,
    role: true,
    status: true,
    emailVerified: true,
    createdAt: true,
    updatedAt: true,
    profile: true,
  },
} as const;

export const DRIVER_WITH_PROFILE = {
  select: {
    id: true,
    email: true,
    role: true,
    status: true,
    emailVerified: true,
    createdAt: true,
    updatedAt: true,
    profile: true,
    driverProfile: true,
  },
} as const;
