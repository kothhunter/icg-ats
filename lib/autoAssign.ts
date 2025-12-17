import type { Applicant, TimeSlot } from '@/types';

export interface SlotCapacity {
  slotId: string;
  currentCount: number;
  maxCapacity: number;
  availableSpots: number;
}

export interface ApplicantWithFlexibility {
  applicant: Applicant;
  flexibility: number; // Number of available slots with room
}

export interface AutoAssignResult {
  placed: Array<{
    applicant: Applicant;
    assignedSlot: TimeSlot;
  }>;
  unplaceable: Applicant[];
}

/**
 * Auto-assign applicants to interview time slots based on availability and flexibility
 *
 * Algorithm:
 * 1. Calculate current capacity for each time slot
 * 2. Filter eligible applicants (needs_interview status, no assigned slot)
 * 3. Calculate flexibility score for each applicant (count of available slots with room)
 * 4. Sort applicants by flexibility (ASC) then applied_date (ASC)
 * 5. Assign each applicant to their first available slot with room
 * 6. Return placed and unplaceable applicants
 */
export function autoAssignInterviews(
  applicants: Applicant[],
  timeSlots: TimeSlot[]
): AutoAssignResult {
  // Step 1: Calculate slot capacities
  const slotCapacities = new Map<string, SlotCapacity>();

  timeSlots.forEach((slot) => {
    const currentCount = applicants.filter(
      (a) => a.assigned_slot === slot.id
    ).length;

    slotCapacities.set(slot.id, {
      slotId: slot.id,
      currentCount,
      maxCapacity: slot.max_capacity,
      availableSpots: slot.max_capacity - currentCount,
    });
  });

  // Step 2: Filter eligible applicants
  const eligibleApplicants = applicants.filter(
    (applicant) =>
      applicant.status === 'interviewing' &&
      applicant.assigned_slot === null &&
      applicant.available_slots.length > 0
  );

  // Step 3: Calculate flexibility for each applicant
  const applicantsWithFlexibility: ApplicantWithFlexibility[] = eligibleApplicants.map(
    (applicant) => {
      // Count how many of their available slots have room
      const flexibility = applicant.available_slots.filter((slotId) => {
        const capacity = slotCapacities.get(slotId);
        return capacity && capacity.availableSpots > 0;
      }).length;

      return {
        applicant,
        flexibility,
      };
    }
  );

  // Step 4: Sort by flexibility (ASC) then applied_date (ASC)
  applicantsWithFlexibility.sort((a, b) => {
    // First sort by flexibility (lower = more constrained = higher priority)
    if (a.flexibility !== b.flexibility) {
      return a.flexibility - b.flexibility;
    }

    // Then by applied date (earlier = higher priority)
    const dateA = new Date(a.applicant.applied_date).getTime();
    const dateB = new Date(b.applicant.applied_date).getTime();
    return dateA - dateB;
  });

  // Step 5: Assign applicants to slots
  const placed: Array<{ applicant: Applicant; assignedSlot: TimeSlot }> = [];
  const unplaceable: Applicant[] = [];

  applicantsWithFlexibility.forEach(({ applicant, flexibility }) => {
    // If no flexibility, cannot place
    if (flexibility === 0) {
      unplaceable.push(applicant);
      return;
    }

    // Try to assign to the first available slot
    let assigned = false;

    for (const slotId of applicant.available_slots) {
      const capacity = slotCapacities.get(slotId);

      if (capacity && capacity.availableSpots > 0) {
        // Find the actual TimeSlot object
        const timeSlot = timeSlots.find((ts) => ts.id === slotId);

        if (timeSlot) {
          // Assign this applicant to this slot
          placed.push({
            applicant: { ...applicant, assigned_slot: slotId },
            assignedSlot: timeSlot,
          });

          // Update the capacity tracker
          capacity.availableSpots -= 1;
          capacity.currentCount += 1;

          assigned = true;
          break;
        }
      }
    }

    if (!assigned) {
      unplaceable.push(applicant);
    }
  });

  return {
    placed,
    unplaceable,
  };
}
