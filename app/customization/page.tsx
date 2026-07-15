"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Service } from "@/types/Services";
import * as TablerIcons from "@tabler/icons-react";

type PatientType = "new" | "old" | "both";

// defaults when empty form is used
const EMPTY_FORM: Omit<Service, "id"> = {
    label_en: "",
    label_fil: "",
    icon_src: "",
    display_order: 0,
    description_en: "",
    description_fil: "",
    patient_type: "both",
};

function resolveIcon(iconName: string) {
    return (
        (TablerIcons as Record<string, any>)[iconName] ??
        TablerIcons.IconCircleDashed
    );
}

// main method for the page
export default function AdminServicePage() {

    // create supabase client
    const supabase = useMemo(() => createClient(), []);

    // state for services and loading
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setloading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // state for editing and form
    const [editingId, setEditingId] = useState<number | "new" | null>(null);
    const [form, setForm] = useState<Omit<Service, "id">>(EMPTY_FORM);
    const [iconQuery, setIconQuery] = useState("");
    const [saving, setSaving] = useState(false);

    const allIconNames = useMemo(() => Object.keys(TablerIcons).filter((key) => key.startsWith("Icon") && key !== "IconCircleDashed"), []);

    // filter icon names based on query
    const filteredIconNames = useMemo(() => {
        if (!iconQuery) return allIconNames.slice(0,20);
        return allIconNames
        .filter ((name) => name.toLowerCase().includes(iconQuery.toLowerCase()))
        .slice (0,30);
    }, [iconQuery, allIconNames]
    )

    // function to load services from supabase
    async function loadServices() {
        setloading(true);
        const { data, error} = await supabase
        .from("services")
        .select("*")
        .order("display_order", { ascending: true });

        if (error) {
            setError(error.message);
        }
        else {
            setServices(data as Service[]);
            setError(null);
        }
        setloading(false);
    }

    useEffect(() => {
        loadServices();
    }, []);

    // handles the creation
    function startCreate() {
        setEditingId("new");
        setForm({
            ...EMPTY_FORM,
            display_order: services.length
            ? Math.max(...services.map((s) => s.display_order)) + 1: 0,
        });
        setIconQuery("");
    }

    // handles the editing
    function startEdit(service: Service) {
        setEditingId(service.id);
        const {id, ...rest} = service;
        setForm(rest);
        setIconQuery(service.icon_src);
    }

    function cancelEdit() {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setIconQuery("");
    }

    async function handleSave() {
        if (!form.label_en.trim() || !form.label_fil.trim()){
            setError("English and Filipino label are both required.")
            return;
        } 
        if (!allIconNames.includes(form.icon_src)){
            setError("Please pick a valid icon from the suggestion list.")
            return;
        }

        setSaving(true);
        setError(null);

        if (editingId === "new"){
            const { error } = await supabase
            .from("services")
            .insert([form]);
            if (error) setError(error.message);
        }
        else if (editingId !== null) {
            const { error } = await supabase
            .from("services")
            .update(form)
            .eq("id", editingId);
            if(error) setError(error.message);
        }

        setSaving(false);
        cancelEdit();
        loadServices();
    }

    async function handleDelete(id: number) {
        if (!confirm("Delete this service? This cannot be undone"))
            return;

        const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", id)
        if (error) {
            setError(error.message);
        }
        else {
            loadServices();
        }
    }

    const isEditing = editingId !== null;

    return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Manage Services</h1>
        {!isEditing && (
          <button
            onClick={startCreate}
            className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          >
            + Add Service
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 text-red-700 text-sm px-4 py-2">
          {error}
        </div>
      )}

      {isEditing && (
        <div className="mb-8 border rounded-lg p-5 bg-black">
          <h2 className="font-medium mb-4">
            {editingId === "new" ? "New Service" : "Edit Service"}
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Label (English)
                </label>
                <input
                  type="text"
                  value={form.label_en}
                  onChange={(e) =>
                    setForm({ ...form, label_en: e.target.value })
                  }
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  placeholder="e.g. Consultation"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Label (Filipino)
                </label>
                <input
                  type="text"
                  value={form.label_fil}
                  onChange={(e) =>
                    setForm({ ...form, label_fil: e.target.value })
                  }
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  placeholder="e.g. Konsultasyon"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Description (English)
                </label>
                <textarea
                  value={form.description_en}
                  onChange={(e) =>
                    setForm({ ...form, description_en: e.target.value })
                  }
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Description (Filipino)
                </label>
                <textarea
                  value={form.description_fil}
                  onChange={(e) =>
                    setForm({ ...form, description_fil: e.target.value })
                  }
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Patient Type
                </label>
                <select
                  value={form.patient_type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      patient_type: e.target.value as PatientType,
                    })
                  }
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                >
                  <option value="new">New Patient only</option>
                  <option value="old">Old Patient only</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={form.display_order}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      display_order: Number(e.target.value),
                    })
                  }
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>


            <div>
              <label className="block text-sm font-medium mb-1">Icon</label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={iconQuery}
                  onChange={(e) => {
                    setIconQuery(e.target.value);
                    setForm({ ...form, icon_src: e.target.value });
                  }}
                  className="flex-1 border rounded-md px-3 py-2 text-sm"
                  placeholder="Search Tabler icon name, e.g. IconStethoscope"
                />
              </div>

              {iconQuery && filteredIconNames.length > 0 && (
                <div className="mt-2 border rounded-md bg-white max-h-40 overflow-y-auto">
                  {filteredIconNames.map((name) => {
                    const Icon = resolveIcon(name);
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => {
                          setIconQuery(name);
                          setForm({ ...form, icon_src: name });
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 text-left"
                      >
                        <Icon size={16} />
                        {name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 mt-5">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={cancelEdit}
              className="px-4 py-2 rounded-md border text-sm font-medium hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading services...</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-4 py-2">Icon</th>
                <th className="px-4 py-2">Label (EN / FIL)</th>
                <th className="px-4 py-2">Patient Type</th>
                <th className="px-4 py-2">Order</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => {
                const Icon = resolveIcon(service.icon_src);
                return (
                  <tr key={service.id} className="border-t">
                    <td className="px-4 py-2">
                      {service.label_en} / {service.label_fil}
                    </td>
                    <td className="px-4 py-2 capitalize">
                      {service.patient_type}
                    </td>
                    <td className="px-4 py-2">{service.display_order}</td>
                    <td className="px-4 py-2 text-right space-x-2">
                      <button
                        onClick={() => startEdit(service)}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
              {services.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                    No services yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}