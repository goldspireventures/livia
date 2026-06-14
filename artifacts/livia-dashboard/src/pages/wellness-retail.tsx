import { Redirect } from "wouter";

/** Legacy route — unified tenant store at /store. */
export default function WellnessRetailPage() {
  return <Redirect to="/store" />;
}
