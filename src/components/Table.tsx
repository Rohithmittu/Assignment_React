import { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { OverlayPanel } from "primereact/overlaypanel";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";

interface Data {
  id: number;
  title: string | null;
  place_of_origin: string | null;
  artist_display: string | null;
  inscriptions: string | null;
  date_start: number | null;
  date_end: number | null;
}

export default function BasicDemo() {
  const [data, setData] = useState<Data[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedData, setSelectedData] = useState<Data[]>([]);
  const [rowCount, setRowCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [rows, setRows] = useState<number>(12);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const op = useRef<OverlayPanel>(null);

  const fetchArtworks = async (pageNum: number, pageSize: number) => {
    setLoading(true);
    try {
      const fields =
        "id,title,place_of_origin,artist_display,inscriptions,date_start,date_end";

      const res = await fetch(
        // `https://api.artic.edu/api/v1/artworks?page=${pageNum}&fields=${fields}`
        `https://api.artic.edu/api/v1/artworks?page=${pageNum}&limit=${pageSize}&fields=${fields}`
      );
      const json = await res.json();

      const data: Data[] = (json.data || []).map((d: any) => ({
        id: d.id,
        title: d.title ?? null,
        place_of_origin: d.place_of_origin ?? null,
        artist_display: d.artist_display ?? null,
        inscriptions: d.inscriptions ?? null,
        date_start: d.date_start ?? null,
        date_end: d.date_end ?? null,
      }));

      setData(data);
      setTotalRecords(json.pagination?.total ?? 0);
    } catch (error) {
      console.error("Error fetching artworks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtworks(page, rows);
  }, [page, rows]);

  const selectionHeader = (
    <div className="flex align-items-center gap-2">
      <Button
        icon="pi pi-angle-down"
        className="p-button-text p-button-sm"
        onClick={(e) => op.current?.toggle(e)}
      />
      <OverlayPanel ref={op}>
        <div className="p-fluid">
          <label htmlFor="rows">Number of rows to select</label>
          <InputText
            id="rows"
            type="number"
            value={rowCount ? rowCount.toString() : ""}
            onChange={(e) => setRowCount(Number(e.target.value))}
            placeholder="Enter number"
            onKeyDown={async (e) => {
              if (e.key === "Enter") {
                const currentSelected = selectedData.length;
                const remainingToSelect = rowCount - currentSelected;

                if (remainingToSelect <= 0) {
                  setSelectedData(selectedData.slice(0, rowCount));
                } else {
                  let newSelection = [...selectedData];
                  const notSelectedCurrent = data.filter(
                    (d) => !newSelection.find((s) => s.id === d.id)
                  );
                  newSelection = [
                    ...newSelection,
                    ...notSelectedCurrent.slice(0, remainingToSelect),
                  ];

                  let nextPage = page + 1;
                  let remaining = remainingToSelect - notSelectedCurrent.length;

                  while (
                    remaining > 0 &&
                    nextPage <= Math.ceil(totalRecords / rows)
                  ) {
                    const res = await fetch(
                      `https://api.artic.edu/api/v1/artworks?page=${nextPage}&fields=id,title,place_of_origin,artist_display,inscriptions,date_start,date_end`
                    );
                    const json = await res.json();
                    const nextData: Data[] = (json.data || []).map(
                      (d: Data) => ({
                        id: d.id,
                        title: d.title ?? null,
                        place_of_origin: d.place_of_origin ?? null,
                        artist_display: d.artist_display ?? null,
                        inscriptions: d.inscriptions ?? null,
                        date_start: d.date_start ?? null,
                        date_end: d.date_end ?? null,
                      })
                    );

                    const toAdd = nextData.slice(0, remaining);
                    newSelection = [...newSelection, ...toAdd];
                    remaining -= toAdd.length;
                    nextPage++;
                  }

                  setSelectedData(newSelection);
                }

                op.current?.hide();
              }
            }}
          />
        </div>
      </OverlayPanel>
    </div>
  );

  return (
    <div className="card">
      {loading && <p>Loading...</p>}
      <DataTable
        value={data}
        tableStyle={{ minWidth: "60rem" }}
        paginator
        first={(page - 1) * rows}
        rows={rows}
        totalRecords={totalRecords}
        lazy
        onPage={(e) => {
          setPage(e.page + 1);
          setRows(e.rows);
        }}
        selectionMode="multiple"
        selection={selectedData.filter((s) => data.find((d) => d.id === s.id))} // <-- show only current page selections
        onSelectionChange={(e) => {
          // Merge current page selection with previously selected rows
          const newSelection = [
            ...selectedData.filter((s) => !data.find((d) => d.id === s.id)), // keep previous pages
            ...e.value, // add current page selections
          ];
          setSelectedData(newSelection);
        }}
        dataKey="id"
      >
        <Column
          selectionMode="multiple"
          header={selectionHeader}
          headerStyle={{ width: "5rem" }}
        />

        <Column field="title" header="Title" />
        <Column field="place_of_origin" header="Place of Origin" />
        <Column field="artist_display" header="Artist" />
        <Column field="inscriptions" header="Inscriptions" />
        <Column field="date_start" header="Date Start" />
        <Column field="date_end" header="Date End" />
      </DataTable>
    </div>
  );
}
