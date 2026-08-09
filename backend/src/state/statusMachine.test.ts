import { describe, expect, it } from "vitest";
import {
    ORDER_STATUSES,
    canTransition,
    isOrderStatus,
} from "./statusMachine";

describe("isOrderStatus", () => {
    it("returns true for all valid statuses", () => {
        for (const status of ORDER_STATUSES) {
            expect(isOrderStatus(status)).toBe(true);
        }
    });

    it("returns false for unknown statuses", () => {
        expect(isOrderStatus("shipped")).toBe(false);
        expect(isOrderStatus("")).toBe(false);
        expect(isOrderStatus("PENDING")).toBe(false);
    });
});

describe("canTransition — valid forward transitions", () => {
    const validTransitions: Array<[string, string]> = [
        ["pending", "picked_up"],
        ["picked_up", "in_transit"],
        ["in_transit", "out_for_delivery"],
        ["out_for_delivery", "delivered"],
    ];

    it.each(validTransitions)("allows %s → %s", (from, to) => {
        expect(canTransition(from as never, to as never).allowed).toBe(true);
    });
});

describe("canTransition — cancelled allowed from any pre-delivered state", () => {
    it.each(["pending", "picked_up", "in_transit", "out_for_delivery"])(
        "allows %s → cancelled",
        (from) => {
            expect(canTransition(from as never, "cancelled").allowed).toBe(
                true
            );
        }
    );
});

describe("canTransition — terminal states", () => {
    it("rejects any transition out of delivered", () => {
        for (const to of ORDER_STATUSES) {
            if (to !== "delivered") {
                expect(
                    canTransition("delivered", to).allowed
                ).toBe(false);
            }
        }
    });

    it("rejects any transition out of cancelled", () => {
        for (const to of ORDER_STATUSES) {
            if (to !== "cancelled") {
                expect(canTransition("cancelled", to).allowed).toBe(false);
            }
        }
    });

    it("rejects delivered → cancelled", () => {
        expect(canTransition("delivered", "cancelled").allowed).toBe(false);
    });
});

describe("canTransition — illegal skips", () => {
    const illegalTransitions: Array<[string, string]> = [
        ["pending", "in_transit"],
        ["pending", "out_for_delivery"],
        ["pending", "delivered"],
        ["picked_up", "out_for_delivery"],
        ["picked_up", "delivered"],
        ["in_transit", "delivered"],
        ["in_transit", "pending"],
        ["out_for_delivery", "pending"],
        ["out_for_delivery", "in_transit"],
    ];

    it.each(illegalTransitions)("rejects %s → %s", (from, to) => {
        const result = canTransition(from as never, to as never);
        expect(result.allowed).toBe(false);
        expect(result.reason).toBe(
            `Cannot move from "${from}" to "${to}"`
        );
    });
});

describe("canTransition — no-op transitions", () => {
    it("rejects same-status transitions with a clear reason", () => {
        const result = canTransition("pending", "pending");
        expect(result.allowed).toBe(false);
        expect(result.reason).toBe('Order is already "pending"');
    });
});