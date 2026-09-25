import Link from "next/link";
import { getListings, formatPrice, STATUS_LABEL } from "@/lib/listings";
import DeleteListingButton from "@/components/admin/DeleteListingButton";
import ArchiveListingButton from "@/components/admin/ArchiveListingButton";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const showArchived = view === "archived";

  const allListings = await getListings();
  const available = allListings.filter((l) => l.status === "available" && !l.archived).length;
  const rentals = allListings.filter((l) => l.type === "rental" && !l.archived).length;
  const forSale = allListings.filter((l) => l.type === "sale" && !l.archived).length;
  const archivedCount = allListings.filter((l) => l.archived).length;

  const listings = allListings.filter((l) => l.archived === showArchived);

  return (
    <>
      <div className="stat-row">
        <div className="stat-card">
          <div className="label">Rentals listed</div>
          <div className="value">{rentals}</div>
        </div>
        <div className="stat-card">
          <div className="label">Available</div>
          <div className="value green">{available}</div>
        </div>
        <div className="stat-card">
          <div className="label">For sale</div>
          <div className="value">{forSale}</div>
        </div>
      </div>

      <div className="admin-actions" style={{ marginBottom: "1rem", justifyContent: "space-between" }}>
        <Link className="btn btn-navy" href="/admin/listings/new">
          + Add property
        </Link>
        <div style={{ display: "flex", gap: "1rem", fontSize: "0.9rem" }}>
          <Link href="/admin" style={{ fontWeight: showArchived ? 400 : 700 }}>
            Active
          </Link>
          <Link href="/admin?view=archived" style={{ fontWeight: showArchived ? 700 : 400 }}>
            Archived ({archivedCount})
          </Link>
        </div>
      </div>

      <div className="table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Address</th>
              <th>Type</th>
              <th>Price</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {listings.map((listing) => (
              <tr key={listing.id}>
                <td>{listing.address}</td>
                <td>{listing.type === "rental" ? "Rental" : "For sale"}</td>
                <td>{formatPrice(listing)}</td>
                <td>
                  <span className={`status-badge status-${listing.status}`}>
                    {STATUS_LABEL[listing.status]}
                  </span>
                </td>
                <td className="edit-cell" style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                  <Link href={`/admin/listings/${listing.id}/edit`}>Edit</Link>
                  <ArchiveListingButton listingId={listing.id} archived={listing.archived} />
                  <DeleteListingButton listingId={listing.id} address={listing.address} />
                </td>
              </tr>
            ))}
            {listings.length === 0 && (
              <tr>
                <td colSpan={5} style={{ color: "#6b7280", padding: "1.5rem 0.5rem" }}>
                  {showArchived
                    ? "No archived properties."
                    : "No properties yet — add the first one above."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
