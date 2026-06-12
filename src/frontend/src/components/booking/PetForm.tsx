import { Plus, Trash2 } from "lucide-react";
import React from "react";

export interface Pet {
  id: string;
  name: string;
  type: string;
  breed: string;
  age: string;
  notes: string;
}

interface Props {
  pets: Pet[];
  onChange: (pets: Pet[]) => void;
}

const PET_TYPES = ["Dog", "Cat", "Bird", "Rabbit", "Other"];

function newPet(): Pet {
  return {
    id: `${Date.now()}-${Math.random()}`,
    name: "",
    type: "Dog",
    breed: "",
    age: "",
    notes: "",
  };
}

export default function PetForm({ pets, onChange }: Props) {
  const update = (id: string, field: keyof Pet, value: string) =>
    onChange(pets.map((p) => (p.id === id ? { ...p, [field]: value } : p)));

  return (
    <div className="space-y-4">
      {pets.map((pet, idx) => (
        <div
          key={pet.id}
          className="border border-gray-200 rounded-xl p-4 bg-gray-50/50"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-700 text-sm">Pet {idx + 1}</h4>
            {pets.length > 1 && (
              <button
                type="button"
                onClick={() => onChange(pets.filter((p) => p.id !== pet.id))}
                className="text-red-400 hover:text-red-600 p-1 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label
                htmlFor={`pet-name-${pet.id}`}
                className="text-xs text-gray-500 mb-1 block"
              >
                Pet Name *
              </label>
              <input
                id={`pet-name-${pet.id}`}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Buddy"
                value={pet.name}
                onChange={(e) => update(pet.id, "name", e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor={`pet-type-${pet.id}`}
                className="text-xs text-gray-500 mb-1 block"
              >
                Type *
              </label>
              <select
                id={`pet-type-${pet.id}`}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                value={pet.type}
                onChange={(e) => update(pet.id, "type", e.target.value)}
              >
                {PET_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor={`pet-breed-${pet.id}`}
                className="text-xs text-gray-500 mb-1 block"
              >
                Breed
              </label>
              <input
                id={`pet-breed-${pet.id}`}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Labrador"
                value={pet.breed}
                onChange={(e) => update(pet.id, "breed", e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor={`pet-age-${pet.id}`}
                className="text-xs text-gray-500 mb-1 block"
              >
                Age
              </label>
              <input
                id={`pet-age-${pet.id}`}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                placeholder="3 years"
                value={pet.age}
                onChange={(e) => update(pet.id, "age", e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <label
                htmlFor={`pet-notes-${pet.id}`}
                className="text-xs text-gray-500 mb-1 block"
              >
                Special Notes
              </label>
              <textarea
                id={`pet-notes-${pet.id}`}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                placeholder="Allergies, medications, personality..."
                rows={2}
                value={pet.notes}
                onChange={(e) => update(pet.id, "notes", e.target.value)}
              />
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...pets, newPet()])}
        className="w-full border-2 border-dashed border-indigo-300 rounded-xl p-3 text-indigo-600 text-sm font-medium hover:border-indigo-500 hover:bg-indigo-50/50 transition-all flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Add Another Pet
      </button>
    </div>
  );
}
