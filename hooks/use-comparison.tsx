"use client";

import React, { createContext, useContext, useCallback, useMemo, ReactNode } from "react";
import { useLocalStorage } from "./use-local-storage";

// Types
export interface CompareVehicle {
    id: string | number;
    type: "sale" | "auction" | "karkey";
    make: string;
    model: string;
    year: number;
    price: number;
    photo: string;
    mileage?: number;
    transmission?: string;
    fuel_type?: string;
    condition?: string;
    location?: string;
    engine_size?: string;
    url: string;
}

interface CompareContextType {
    vehicles: CompareVehicle[];
    addToCompare: (vehicle: CompareVehicle) => boolean;
    removeFromCompare: (id: string | number) => void;
    clearComparison: () => void;
    isInCompare: (id: string | number) => boolean;
    canAdd: boolean;
    count: number;
    addMany: (vehicles: CompareVehicle[]) => void;
}

const MAX_COMPARE = 4;

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: ReactNode }) {
    const [vehicles, setVehicles, clearVehicles] = useLocalStorage<CompareVehicle[]>("karkey_compare", []);

    const addToCompare = useCallback((vehicle: CompareVehicle): boolean => {
        const exists = vehicles.some((v) => v.id === vehicle.id && v.type === vehicle.type);
        if (exists) return false;
        if (vehicles.length >= MAX_COMPARE) return false;
        setVehicles((prev) => [...prev, vehicle]);
        return true;
    }, [vehicles, setVehicles]);

    const removeFromCompare = useCallback((id: string | number) => {
        setVehicles((prev) => prev.filter((v) => v.id !== id));
    }, [setVehicles]);

    const clearComparison = useCallback(() => {
        clearVehicles();
    }, [clearVehicles]);

    const isInCompare = useCallback((id: string | number): boolean => {
        return vehicles.some((v) => v.id === id);
    }, [vehicles]);

    const canAdd = vehicles.length < MAX_COMPARE;
    const count = vehicles.length;

    const contextValue = useMemo<CompareContextType>(() => ({
        vehicles,
        addToCompare,
        removeFromCompare,
        clearComparison,
        isInCompare,
        canAdd,
        count,
        addMany: (newVehicles: CompareVehicle[]) => {
            setVehicles(prev => {
                const combined = [...prev];
                newVehicles.forEach(v => {
                    if (!combined.some(existing => existing.id === v.id)) {
                        if (combined.length < MAX_COMPARE) {
                            combined.push(v);
                        }
                    }
                });
                return combined;
            });
        }
    }), [vehicles, addToCompare, removeFromCompare, clearComparison, isInCompare, canAdd, count, setVehicles]);

    return (
        <CompareContext.Provider value={contextValue} >
            {children}
        </CompareContext.Provider>
    );
}

export function useCompare() {
    const context = useContext(CompareContext);
    if (!context) {
        throw new Error("useCompare must be used within a CompareProvider");
    }
    return context;
}

export function toCompareVehicle(car: any, type: "sale" | "auction" | "karkey", language: string = "en"): CompareVehicle {
    // Helper implementation...
    const id = car.id || car.auction_id || car.listing_id;
    let photo = "";
    if (car.photo) photo = car.photo;
    else if (car.photos && car.photos.length > 0) {
        const p = car.photos[0];
        photo = typeof p === "string" ? p : p.photo_url || p.url || "";
        if (photo && !photo.startsWith("http") && p.photo_url) photo = `https://img.karkey.space/vehicles/${photo}`;
    } else if (car.thumbnail) photo = car.thumbnail;

    let url = "";
    switch (type) {
        case "sale": url = `/${language}/direct-sales/${id}`; break;
        case "auction": url = `/${language}/auctions/${id}`; break;
        default: url = `/${language}/karkey-cars/${id}`;
    }

    return {
        id, type, make: car.make || car.brand || "Unknown", model: car.model || "Unknown",
        year: car.year || new Date().getFullYear(),
        price: typeof car.price === "string" ? parseFloat(car.price) : (car.price || 0),
        photo,
        mileage: car.mileage || car.kilometers,
        transmission: car.transmission,
        fuel_type: car.fuel_type || car.fuelType,
        condition: car.condition || car.vehicle_condition,
        location: car.location || car.city,
        engine_size: car.engine_size || car.engineSize,
        url,
    };
}
