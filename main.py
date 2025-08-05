#!/usr/bin/env python3
"""
PostgreSQL Data Enrichment Script with OpenAI Translation
Fetches content from database, generates Vietnamese translation dictionaries using OpenAI,
and updates the database with the results.
"""

import os
import json
import psycopg2
from openai import OpenAI
import sys

def get_database_connection():
    """Establish PostgreSQL database connection using DATABASE_URL from secrets."""
    try:
        database_url = os.environ.get('DATABASE_URL')
        if not database_url:
            raise ValueError("DATABASE_URL not found in environment variables")
        
        conn = psycopg2.connect(database_url)
        print("Successfully connected to PostgreSQL database")
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        sys.exit(1)

def get_openai_client():
    """Initialize OpenAI client using OPENAI_API_KEY from secrets."""
    try:
        api_key = os.environ.get('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")
        
        client = OpenAI(api_key=api_key)
        print("Successfully initialized OpenAI client")
        return client
    except Exception as e:
        print(f"Error initializing OpenAI client: {e}")
        sys.exit(1)

def fetch_content_rows(conn, field_choice='short_blurb'):
    """Fetch content rows that need translation dictionaries."""
    try:
        cursor = conn.cursor()
        
        # Choose which field to process
        field_name = field_choice if field_choice in ['short_blurb', 'short_description'] else 'short_blurb'
        print(f"Processing field: {field_name}")
        
        query = f"""
        SELECT id, {field_name} 
        FROM public.content 
        WHERE translation_dictionary IS NULL 
        AND {field_name} IS NOT NULL 
        AND {field_name} != ''
        LIMIT 300
        """
        cursor.execute(query)
        rows = cursor.fetchall()
        cursor.close()
        print(f"Fetched {len(rows)} rows for processing")
        return rows
    except Exception as e:
        print(f"Error fetching content rows: {e}")
        return []

def generate_translation_dictionary(client, content_text):
    """Call OpenAI API to generate Vietnamese translation dictionary."""
    try:
        system_message = (
            "You are an expert linguistic assistant helping young Vietnamese learners understand English academic content. "
            "Your task is to identify 5-10 COMPLICATED vocabulary words that would be challenging for Vietnamese students. "
            "Focus on: abstract concepts, academic terminology, complex adjectives, philosophical terms, technical vocabulary. "
            "AVOID: proper names, places, people's names, simple words, basic vocabulary. "
            "Return ONLY a valid, raw JSON object with English terms as lowercase keys and Vietnamese translations as values."
        )
        
        user_message = f"Here is the text: {content_text}. Please create the translation JSON."
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message}
            ],
            temperature=0.3,
            max_tokens=500
        )
        
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error calling OpenAI API: {e}")
        return None

def update_translation_dictionary(conn, content_id, translation_dict):
    """Update the translation_dictionary column for the specified content ID."""
    try:
        cursor = conn.cursor()
        update_query = """
        UPDATE public.content 
        SET translation_dictionary = %s 
        WHERE id = %s
        """
        cursor.execute(update_query, (json.dumps(translation_dict), content_id))
        conn.commit()
        cursor.close()
        return True
    except Exception as e:
        print(f"Error updating database for content ID {content_id}: {e}")
        return False

def main():
    """Main function to orchestrate the data enrichment process."""
    print("Starting PostgreSQL data enrichment with OpenAI translations")
    
    # Initialize connections
    conn = get_database_connection()
    client = get_openai_client()
    
    try:
        # Fetch content rows that need processing
        # Change 'short_blurb' to 'short_description' to process different field
        rows = fetch_content_rows(conn, 'short_blurb')
        
        if not rows:
            print("No rows found that need translation dictionaries")
            return
        
        # Process each row
        for content_id, content_text in rows:
            print(f"Processing content ID: {content_id}")
            
            # Skip if content_text is empty or None
            if not content_text or not content_text.strip():
                print(f"Skipping content ID {content_id}: empty content_text")
                continue
            
            # Generate translation dictionary using OpenAI
            ai_response = generate_translation_dictionary(client, content_text)
            
            if not ai_response:
                print(f"Failed to get response from OpenAI for content ID {content_id}")
                continue
            
            # Parse JSON response - clean up markdown formatting if present
            try:
                # Remove markdown code block formatting if present
                cleaned_response = ai_response.strip()
                if cleaned_response.startswith('```json'):
                    cleaned_response = cleaned_response[7:]  # Remove ```json
                if cleaned_response.startswith('```'):
                    cleaned_response = cleaned_response[3:]   # Remove ```
                if cleaned_response.endswith('```'):
                    cleaned_response = cleaned_response[:-3]  # Remove trailing ```
                cleaned_response = cleaned_response.strip()
                
                translation_dict = json.loads(cleaned_response)
                
                # Validate that it's a dictionary
                if not isinstance(translation_dict, dict):
                    print(f"Error for content ID {content_id}: AI response is not a valid dictionary")
                    continue
                
                # Update database
                if update_translation_dictionary(conn, content_id, translation_dict):
                    print(f"Successfully updated content ID: {content_id}")
                    print(f"Translation dictionary: {translation_dict}")
                else:
                    print(f"Failed to update database for content ID {content_id}")
                    
            except json.JSONDecodeError as e:
                print(f"Error parsing JSON for content ID {content_id}: {e}")
                print(f"AI response was: {ai_response}")
                continue
            except Exception as e:
                print(f"Unexpected error processing content ID {content_id}: {e}")
                continue
    
    except Exception as e:
        print(f"Unexpected error in main processing: {e}")
    
    finally:
        # Ensure database connection is closed
        if conn:
            conn.close()
            print("Database connection closed")
    
    print("Data enrichment process completed")

if __name__ == "__main__":
    main()