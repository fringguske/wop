import { logout } from "../login/actions";

export default function LogoutButton() {
  return (
    <form action={logout}>
      <button className="logout-button" type="submit">
        Log out
      </button>
    </form>
  );
}