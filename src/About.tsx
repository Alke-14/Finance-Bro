import React from 'react';
import { Input } from './components/ui/input';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import {animate} from 'animejs';
import  Car_Green_SVG from './assets/Car_Green_Front.svg';
import Car_Blue_SVG from './assets/Car_Blue_Front.svg';
import pipe from './assets/purzen-A-green-cartoon-pipe.svg'
import './About.css';
import { Button } from './components/ui/button';

const About: React.FC = () => {
    return (
        <div className='bg-linear-to-t from-green-800 to-gray-800 h-screen w-full flex items-center justify-center'>
            <img src={pipe} alt="Pipe" className='pipe w-100 h-100 absolute self-center left-0 rotate-90 z-1'/>
            <div className='absolute flex flex-col top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-gray-700 border-4 rounded-2xl bg-gray-600 h-[300px] justify-center items-center w-[65vw] opacity-80'>
                <img src={Car_Green_SVG} alt="Car Vibes" className='car w-10 mb-1 translate-x-[-530px] mx-auto rotate-270'/>
                <img src={Car_Blue_SVG} alt="Car Vibes" className='car w-10 mb-1 translate-x-[-430px] mx-auto rotate-270'/>
                <img src={Car_Green_SVG} alt="Car Vibes" className='car w-10 mb-1 translate-x-[-550px] mx-auto rotate-270'/>
            </div>
            <img src={pipe} alt="Pipe" className='pipe w-100 h-100 absolute self-center right-0 rotate-270 z-1'/>
            <div className="z-1 p-6 bg-white rounded-lg shadow-md">
                
                <FieldGroup className='w-[400px]'>
                    <FieldSet>
                        <FieldLegend>CarVibes</FieldLegend>
                        <FieldDescription>Let's find the right vehicle that matches your vibe</FieldDescription>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor='time-spent'>How do you spend your weekends?</FieldLabel>
                                <Input id='time-spent' placeholder='e.g. Relaxing at home' required/>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor='reaction'>What would you want people's reaction to be when they see your car?</FieldLabel>
                                <Input id='reaction' placeholder='e.g. Amazed' required/>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor='driving-type'>What is your driving style?</FieldLabel>
                                <Input id='driving-type' placeholder='e.g. Smooth and steady; I care about comfort' required/>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor='important-detail'>What matters the most to you when picking a car?</FieldLabel>
                                <Input id='important-detail' placeholder='e.g. Performance and power' required/>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor='frequency'>How often do you drive?</FieldLabel>
                                <Input id='frequency' placeholder='e.g. Every day for work' required/>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor='music'>What music do you vibe the most with?</FieldLabel>
                                <Input id='music' placeholder='e.g. Indie or acoustic' required/>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor='travel'>What location would be your favorite to travel to?</FieldLabel>
                                <Input id='travel' placeholder='e.g. a mountain in the cabin' required/>
                            </Field>
                        </FieldGroup>
                        <Button className='mt-4 w-full' type='submit'>Find My CarVibe Match</Button>
                    </FieldSet>
                </FieldGroup>
            </div>
            
        </div>
    )
}

export default About;