"use client"
import { Link } from 'react-router-dom';
import {
  NavigationMenu,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

function Nav() {
    return (
    <div className="p-4 bg-gray-800 text-white">
        <NavigationMenu>
            <NavigationMenuList className='flex space-x-4'>
                <NavigationMenuLink asChild>
                    <Link to="/" className={cn(buttonVariants({ variant: "ghost" }))}>Home</Link>
                </NavigationMenuLink>
                <NavigationMenuLink asChild>
                    <Link to="/form" className={cn(buttonVariants({ variant: "ghost" }))}>Form</Link>
                </NavigationMenuLink>
            </NavigationMenuList>
        </NavigationMenu>
    </div> 
    );
}

export default Nav;

