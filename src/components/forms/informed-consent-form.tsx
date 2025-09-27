'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

export function InformedConsentForm() {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-bold text-center mb-4 bg-yellow-400 p-2">INFORMED CONSENT</h2>
        <ScrollArea className="h-96 pr-4">
          <div className="space-y-4 text-sm">
            <p>
              <strong>TREATMENT TO BE DONE:</strong> I understand and consent to have any treatment done by the dentist after the procedure, the risks & benefits & cost have been fully explained. These treatments include but are not limited to: x-rays, cleanings, periodontal treatments, fillings, crowns, bridges, all types of extraction, root canal therapy, & anesthetics.
            </p>

            <p>
              <strong>DRUGS & MEDICATIONS:</strong> I understand that antibiotics, analgesics & other medications can cause allergic reactions like redness & swelling of tissues, pain, itching, vomiting, &/or anaphylactic shock.
            </p>

            <p>
              <strong>CHANGES IN TREATMENT PLAN:</strong> I understand that during treatment it may be necessary to change/add procedures because of conditions found while working on the teeth that were not discovered during examination. For example, root canal therapy may be needed following routine restorative procedures. I give my permission to the dentist to make any/all changes and additions as necessary with my responsibility to pay all the costs agreed.
            </p>

            <p>
              <strong>RADIOGRAPHS:</strong> I understand that an x-ray shot or a radiograph may be necessary as part of a diagnostic aid to come up with a tentative diagnosis of my dental problems and to make a dental treatment plan. I understand there will be a risk & I give my authorization/permission for the use of x-ray as part of my dental care.
            </p>

            <p>
              <strong>REMOVAL OF TEETH:</strong> Alternatives to removal of teeth have been explained to me (root canal therapy, crowns, & periodontal surgery, etc.) & I completely understand these alternatives, including their risk & benefits prior to authorizing the dentist to remove teeth & any other structures necessary for the reasons above. I understand my removing teeth does not always remove all the infections, if present, & it may be necessary to have further treatment. I understand the risk involved in having teeth removed, such as pain, swelling, spread of infection, dry socket, fractured jaw, and loss of feeling on the teeth, lips, tongue & surrounding tissue that can last for an indefinite period of time. I understand I may need further treatment by a specialist if complications arise during or following treatment, the cost of which is my responsibility.
            </p>

            <p>
              <strong>CROWNS [CAPS] & BRIDGES:</strong> Preparing a tooth may irritate the nerve tissue in the center of the tooth, leaving the tooth extra sensitive to heat, cold & pressure. Treating such irritation may involve using special toothpaste, mouth rinses, or root canal therapy. I understand that sometimes it is not possible to match the color of natural teeth exactly with artificial teeth. I further understand that I may be wearing temporary crowns, which may come off easily & that I must be careful to ensure that they are kept on until the permanent crowns are delivered. I realize that the final opportunity to make changes in my new crown, bridge, or cap [including shape, fit, size, & color] will be before permanent cementation. It is also my responsibility to return for permanent cementation within 20 days from tooth preparation, as excessive days delay may allow for tooth movement, which may necessitate a remake of the crown, bridge/cap. I understand that there will be additional charges for remakes due to my delay of more than 20 days from tooth preparation, as excessive days delay may allow for tooth movement, which may necessitate a remake of the crown, bridge/cap. I understand that there will be additional charges for remakes due to my delay of more than 20 days.
            </p>

            <p>
              <strong>ENDODONTICS [ROOT CANAL]:</strong> I understand there is no guarantee that a root canal treatment will save a tooth & that complications can occur from the treatment & that occasionally canal filling materials may extend through the root tip which does not necessarily affect the success of the treatment. I understand that endodontic files/reamers are very fine instruments & stresses can cause them to separate during use. I understand that referring me to an endodontist/specialist for additional treatments may be necessary following root canal treatment & I agree that I am responsible for any additional cost for treatment & that the cost of initial therapy may require retreatment. I also understand that a tooth may require removal if all efforts to save it have failed. I understand that following treatment the tooth may be brittle and may require a crown or other restoration which is not included in the initial fee unless noted that all adjustment or alterations of any kind after the initial period are subject to charges.
            </p>

            <p>
              <strong>PERIODONTAL DISEASE:</strong> I understand that periodontal disease is a serious condition causing gum & bone inflammation &/or loss & that can lead eventually to the loss of my teeth. I understand that alternative treatment plans to correct periodontal disease, including gum surgery and tooth extractions with or without replacement. I understand that undertaking any dental procedures may have a future adverse effect on my periodontal conditions.
            </p>

            <p>
              <strong>FILLINGS:</strong> I understand that care must be exercised in chewing on fillings, especially during the first 24 hours to avoid breakage. I understand that a more extensive filling or a crown may be required at a later time, as additional decay or fracture may become evident after initial excavation. I understand there is no guarantee that a filling will last my lifetime and that eventually all fillings will have to be replaced. I also understand that filling a tooth may irritate the nerve tissue creating sensitivity & a crown is a repair to a tooth that has been damaged by decay or fracture.
            </p>

            <p>
              <strong>DENTURES:</strong> I understand that wearing of dentures can be difficult. Sore spots, altered speech & difficulty in eating are common problems. Immediate dentures [placement of dentures immediately after extractions] may be painful. Immediate dentures may require considerable adjusting & several relines. A permanent reline will be needed later. I understand that it is my responsibility to return for delivery of dentures. I understand that failure to keep my delivery appointment may result in poorly fitted dentures. If a remake is required due to my delays of more than 30 days, there will be additional charges. A permanent reline can be needed later, which is not included in the initial fee. I understand that all adjustments or alterations of any kind after the initial period are subject to charges.
            </p>

            <div className="mt-6 pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                I understand that dentistry is not an exact science and that no dentist can properly guarantee accurate results all the time.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                I hereby authorize any of the doctors/dental auxiliaries to proceed with & perform the dental restorations & treatments as explained to me. I understand that there are subject to modifications depending on the undiagnosable circumstance that may arise during the course of treatment. I understand that regardless of any dental insurance coverage I may have, I am responsible for payment of dental fees. I agree to pay any attorney&apos;s fees, collection fee, or court costs that may be incurred to satisfy any obligation to this office. All treatment were properly explained to me & any untoward circumstances that may arise during the procedure, the attending dentist will not be held liable since it is my free will, with full trust & confidence in him/her to do the procedure under his/her full control.
              </p>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}