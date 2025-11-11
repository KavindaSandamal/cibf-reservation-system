import { Reservation, ReservationStatus, User, Stall, StallSize, DashboardStats } from '../types';

// Generate mock users
export const generateMockUsers = (count: number = 20): User[] => {
  const firstNames = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Emily', 'Chris', 'Amy', 'Tom', 'Lisa', 'Robert', 'Maria', 'James', 'Jessica', 'William', 'Ashley'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor'];
  const businessNames = ['Tech Solutions Inc', 'Global Trading Co', 'Digital Services Ltd', 'Business Partners LLC', 'Innovation Hub', 'Commercial Ventures', 'Enterprise Solutions', 'Trade Center'];

  return Array.from({ length: count }, (_, i) => {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const hasBusiness = Math.random() > 0.5;
    const createdAt = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString();

    return {
      id: i + 1,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      firstName,
      lastName,
      businessName: hasBusiness ? businessNames[Math.floor(Math.random() * businessNames.length)] : undefined,
      createdAt,
      reservationCount: Math.floor(Math.random() * 10),
    };
  });
};

// Generate mock stalls
export const generateMockStalls = (count: number = 30): Stall[] => {
  const sizes: StallSize[] = [StallSize.SMALL, StallSize.MEDIUM, StallSize.LARGE];
  const locations = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3', 'D1', 'D2', 'D3'];
  const descriptions = [
    'Prime location near entrance',
    'Corner stall with extra visibility',
    'Central location with high traffic',
    'Quiet area for focused business',
    'Near food court and amenities',
  ];

  return Array.from({ length: count }, (_, i) => {
    const size = sizes[Math.floor(Math.random() * sizes.length)];
    const basePrice = size === StallSize.SMALL ? 100 : size === StallSize.MEDIUM ? 200 : 300;
    const price = basePrice + Math.floor(Math.random() * 100);
    const isAvailable = Math.random() > 0.4; // 60% available

    return {
      id: i + 1,
      stallNumber: `ST-${String(i + 1).padStart(3, '0')}`,
      stallName: `Stall ${i + 1}`,
      size,
      location: locations[i % locations.length] + (Math.floor(i / locations.length) + 1),
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      isAvailable,
      price,
    };
  });
};

// Generate mock reservations
export const generateMockReservations = (users: User[], stalls: Stall[], count: number = 50): Reservation[] => {
  const statuses: ReservationStatus[] = [ReservationStatus.PENDING, ReservationStatus.CONFIRMED, ReservationStatus.CANCELLED];
  
  return Array.from({ length: count }, (_, i) => {
    const user = users[Math.floor(Math.random() * users.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const stallCount = Math.min(Math.floor(Math.random() * 3) + 1, 3); // 1-3 stalls
    const selectedStalls = stalls
      .filter(s => s.isAvailable || Math.random() > 0.7)
      .slice(0, stallCount)
      .map(s => ({ ...s, isAvailable: false })); // Mark as reserved
    
    const totalAmount = selectedStalls.reduce((sum, stall) => sum + stall.price, 0);
    const reservationDate = new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString();
    const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();
    const confirmedAt = status === ReservationStatus.CONFIRMED 
      ? new Date(new Date(createdAt).getTime() + Math.random() * 24 * 60 * 60 * 1000).toISOString()
      : undefined;
    const cancelledAt = status === ReservationStatus.CANCELLED
      ? new Date(new Date(createdAt).getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      : undefined;

    return {
      id: i + 1,
      userId: user.id,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        businessName: user.businessName,
      },
      reservationDate,
      status,
      createdAt,
      confirmedAt,
      cancelledAt,
      totalAmount,
      stalls: selectedStalls,
    };
  });
};

// Generate mock dashboard stats
export const generateMockDashboardStats = (reservations: Reservation[], stalls: Stall[]): DashboardStats => {
  const totalReservations = reservations.length;
  const activeReservations = reservations.filter(r => r.status === ReservationStatus.CONFIRMED).length;
  const pendingReservations = reservations.filter(r => r.status === ReservationStatus.PENDING).length;
  const cancelledReservations = reservations.filter(r => r.status === ReservationStatus.CANCELLED).length;
  const totalRevenue = reservations
    .filter(r => r.status === ReservationStatus.CONFIRMED)
    .reduce((sum, r) => sum + r.totalAmount, 0);
  
  const reservedStallIds = new Set(
    reservations
      .filter(r => r.status !== ReservationStatus.CANCELLED)
      .flatMap(r => r.stalls.map(s => s.id))
  );
  const occupiedStalls = reservedStallIds.size;
  const stallOccupancyRate = stalls.length > 0 ? (occupiedStalls / stalls.length) * 100 : 0;

  // Generate reservations by date (last 30 days)
  const reservationsByDate = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const dateStr = date.toISOString().split('T')[0];
    const count = reservations.filter(r => {
      const resDate = new Date(r.reservationDate).toISOString().split('T')[0];
      return resDate === dateStr;
    }).length;
    return { date: dateStr, count };
  });

  return {
    totalReservations,
    activeReservations,
    pendingReservations,
    cancelledReservations,
    stallOccupancyRate: Math.round(stallOccupancyRate * 100) / 100,
    totalRevenue,
    reservationsByStatus: {
      pending: pendingReservations,
      confirmed: activeReservations,
      cancelled: cancelledReservations,
    },
    reservationsByDate,
  };
};

